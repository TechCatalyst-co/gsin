const express = require('express');
const DailyBrief = require('../models/DailyBrief');
const NewsItem = require('../models/NewsItem');
const apiKey = require('../middleware/apiKey');
const { machineLimiter } = require('../middleware/rateLimit');
const requireAuth = require('../middleware/auth');
const { requireCapability } = require('../utils/capabilities');
const { normalizeItem, upsertNewsItems } = require('../utils/ingest');
const { isSafeUrl } = require('../utils/slug');

const router = express.Router();

// A brief is an immutable, URL-keyed editorial snapshot with no link to the
// NewsItem collection (see models/DailyBrief.js). To let members join the
// discussion under a brief item, resolve each item's matching NewsItem by url
// (url is unique-indexed) at read time and attach its id + denormalized
// counts. Items with no matching NewsItem are returned unchanged (read-only).
async function withDiscussion(brief) {
  if (!brief || !Array.isArray(brief.items) || brief.items.length === 0) return brief;
  const urls = brief.items.map((i) => i.url).filter(Boolean);
  if (urls.length === 0) return brief;

  const news = await NewsItem.find({ url: { $in: urls } })
    .select('url slug commentCount')
    .lean();
  const byUrl = new Map(news.map((n) => [n.url, n]));

  brief.items = brief.items.map((item) => {
    const n = byUrl.get(item.url);
    if (!n) return item;
    return { ...item, newsItemId: n._id, slug: n.slug, commentCount: n.commentCount || 0 };
  });
  return brief;
}

// Parse a brief's calendar day (from the "August 16, 2026" label or an ISO
// date) into a stable UTC-midnight Date, so one brief maps to exactly one day
// regardless of server timezone.
function parseBriefDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// Turn a YYYY-MM-DD string into the [start, nextDay) UTC range for that day.
function utcDayRange(ymd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const start = new Date(`${ymd}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

// Mirror brief items into the NewsItem collection (upsert by url) so every
// brief card links to a story page with its discussion thread. Only editorial
// fields are written — comment counts and curation flags survive.
async function mirrorItemsToNews(items = []) {
  const normalized = items.filter((i) => i && i.url).map((i) => normalizeItem(i));
  await upsertNewsItems(normalized);
  return normalized.length;
}

// Shape a brief item from the n8n payload, keeping only safe-url items.
function mapItem(raw) {
  return {
    title: raw.title,
    headline: raw.headline,
    url: raw.url,
    source: raw.source || 'RSS',
    published: raw.published ? new Date(raw.published) : undefined,
    category: raw.category,
    urgent: !!raw.urgent,
    impact: raw.impact,
    tier1: !!raw.tier1,
    brand: !!raw.brand,
  };
}

// POST /api/daily-brief — n8n pushes the day's brief here (upsert by day).
// Key-protected. Accepts a single brief object or a one-element array.
router.post('/', machineLimiter, apiKey, async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body[0] : req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Empty payload' });
    }

    const briefingDate = parseBriefDate(payload.briefing_date);
    if (!briefingDate) {
      return res.status(400).json({ error: 'A valid briefing_date is required' });
    }

    // Prefer app_items (the app-shaped list); fall back to the full items list.
    const rawItems = Array.isArray(payload.app_items) && payload.app_items.length
      ? payload.app_items
      : Array.isArray(payload.items) ? payload.items : [];
    const items = rawItems
      .filter((i) => i && i.title && i.url && isSafeUrl(i.url))
      .map(mapItem);

    const doc = {
      briefingDate,
      briefingDateLabel: payload.briefing_date,
      windowStart: payload.window_start,
      windowEnd: payload.window_end,
      // n8n sends `morning_summary`; accept the shorter `summary` too.
      summary: payload.summary ?? payload.morning_summary,
      keyPoints: Array.isArray(payload.key_points) ? payload.key_points : [],
      statsLine: payload.stats_line,
      total: payload.total ?? items.length,
      urgentCount: payload.urgent_count ?? 0,
      positiveCount: payload.positive_count ?? 0,
      tier1Count: payload.tier1_count ?? 0,
      brandCount: payload.brand_count ?? 0,
      items,
    };

    await DailyBrief.updateOne({ briefingDate }, { $set: doc }, { upsert: true });

    // Mirror the day's items into NewsItem so every card is authorable (counts
    // preserved; re-ingesting never resets an already-reviewed article).
    await mirrorItemsToNews(items);

    res.json({ ok: true, briefingDate, itemCount: items.length });
  } catch (err) {
    console.error('daily-brief ingest error:', err);
    res.status(500).json({ error: 'Failed to ingest daily brief' });
  }
});

// GET /api/daily-brief/latest — the newest brief. Default view of the page.
// (Declared before /:date so "latest" isn't captured as a date.)
router.get('/latest', requireAuth, requireCapability('accessDailyBrief'), async (_req, res) => {
  try {
    const brief = await DailyBrief.findOne().sort({ briefingDate: -1 }).lean();
    res.json({ brief: brief ? await withDiscussion(brief) : null });
  } catch (err) {
    console.error('daily-brief latest error:', err);
    res.status(500).json({ error: 'Failed to fetch latest brief' });
  }
});

// GET /api/daily-brief/dates — the days that have a brief (newest first), so
// the archive calendar can enable only those days. (Declared before /:date.)
router.get('/dates', requireAuth, requireCapability('accessDailyBrief'), async (_req, res) => {
  try {
    const rows = await DailyBrief.find().sort({ briefingDate: -1 }).select('briefingDate').lean();
    res.json({ dates: rows.map((r) => r.briefingDate.toISOString().slice(0, 10)) });
  } catch (err) {
    console.error('daily-brief dates error:', err);
    res.status(500).json({ error: 'Failed to fetch brief dates' });
  }
});

// GET /api/daily-brief/:date — the brief for a specific day (YYYY-MM-DD).
router.get('/:date', requireAuth, requireCapability('accessDailyBrief'), async (req, res) => {
  try {
    const range = utcDayRange(req.params.date);
    if (!range) return res.status(400).json({ error: 'Invalid date (expected YYYY-MM-DD)' });

    const brief = await DailyBrief.findOne({
      briefingDate: { $gte: range.start, $lt: range.end },
    }).lean();
    if (!brief) return res.status(404).json({ error: 'No brief for that day' });
    res.json({ brief: await withDiscussion(brief) });
  } catch (err) {
    console.error('daily-brief fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch brief' });
  }
});

module.exports = router;
module.exports.mirrorItemsToNews = mirrorItemsToNews;
