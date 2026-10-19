const express = require('express');
const DailyBrief = require('../models/DailyBrief');
const NewsItem = require('../models/NewsItem');
const apiKey = require('../middleware/apiKey');
const { machineLimiter, readLimiter } = require('../middleware/rateLimit');
const { normalizeItem, upsertNewsItems } = require('../utils/ingest');
const { isSafeUrl } = require('../utils/slug');
const { alertBrief } = require('../utils/push');

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

const BRIEF_TYPES = ['morning', 'evening'];
function briefTypeOf(value) {
  const t = String(value || '').toLowerCase();
  return BRIEF_TYPES.includes(t) ? t : null;
}
const strList = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const objList = (v, map) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object').map(map) : []);
const dateOrUndefined = (v) => { const d = v ? new Date(v) : null; return d && !Number.isNaN(d.getTime()) ? d : undefined; };

// Shape a brief item from the n8n payload, keeping only safe-url items.
function mapItem(raw) {
  // Global SI sends `published` as a human label and `published_at` as ISO.
  const published = dateOrUndefined(raw.published_at) || dateOrUndefined(raw.published);
  return {
    title: raw.title,
    headline: raw.headline,
    url: raw.url,
    source: raw.source || 'RSS',
    published,
    // The desk (domain) is what readers navigate by; the event type is `kind`.
    category: raw.domain || raw.category,
    kind: raw.domain ? raw.category : undefined,
    urgent: !!raw.urgent || Number(raw.urgency_tier) === 1,
    impact: raw.impact,
    tier1: !!raw.tier1,
    brand: !!raw.brand,
    urgencyTier: Number.isFinite(Number(raw.urgency_tier)) ? Number(raw.urgency_tier) : undefined,
    signalScore: Number.isFinite(Number(raw.signal_score)) ? Number(raw.signal_score) : undefined,
    primarySource: raw.primary_source === true,
    domain: raw.domain,
    direction: raw.direction,
    storyKey: raw.story_key,
    industryLine: raw.industry_line,
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
    // Global SI sends two briefs a day. A payload without a type is the legacy
    // single morning edition.
    const briefType = briefTypeOf(payload.brief_type ?? payload.briefType) || 'morning';

    // Prefer app_items (the app-shaped list); fall back to the full items list.
    const rawItems = Array.isArray(payload.app_items) && payload.app_items.length
      ? payload.app_items
      : Array.isArray(payload.items) ? payload.items : [];
    const items = rawItems
      .filter((i) => i && i.title && i.url && isSafeUrl(i.url))
      .map(mapItem);

    const doc = {
      briefingDate,
      briefType,
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
      threatCount: payload.threat_count ?? 0,
      upcomingCount: payload.upcoming_count ?? 0,
      items,

      // Global SI fields.
      plainSummary: payload.plain_summary,
      watchToday: payload.watch_today,
      horizonNote: payload.horizon_note,
      generatedAt: dateOrUndefined(payload.generated_at),
      rubricVersion: payload.rubric_version,
      byDomain: payload.by_domain && typeof payload.by_domain === 'object' ? payload.by_domain : undefined,
      contentLabels: payload.content_labels && typeof payload.content_labels === 'object' ? payload.content_labels : undefined,
      criticalIntelligence: objList(payload.critical_intelligence, (c) => ({
        headline: c.headline, whyItMatters: c.why_it_matters ?? c.whyItMatters, priority: c.priority, domain: c.domain, category: c.category,
        url: c.url && isSafeUrl(c.url) ? c.url : undefined,
      })),
      emergingTrends: objList(payload.emerging_trends, (t) => ({ trend: t.trend, evidence: t.evidence, domain: t.domain })),
      crossDomainInsights: strList(payload.cross_domain_insights),
      forwardWatchlist: objList(payload.forward_watchlist, (w) => ({ item: w.item, window: w.window, why: w.why })),
      watchlistFollowup: objList(payload.watchlist_followup, (f) => ({ predicted: f.predicted, status: f.status, evidence: f.evidence })),
      confidence: Number.isFinite(Number(payload.confidence)) ? Math.max(0, Math.min(100, Number(payload.confidence))) : undefined,
      qaNote: payload.qa_note,
    };
    // Only write fields that were sent, so a re-send never blanks a section.
    for (const k of Object.keys(doc)) if (doc[k] === undefined) delete doc[k];

    await DailyBrief.updateOne({ briefingDate, briefType }, { $set: doc }, { upsert: true });

    // Mirror the day's items into NewsItem so every card is authorable (counts
    // preserved; re-ingesting never resets an already-reviewed article). The
    // full raw items go through so the grading fields land too.
    await mirrorItemsToNews(rawItems.filter((i) => i && i.title && i.url && isSafeUrl(i.url)));

    // One push per brief per day ("Morning Briefing is out"), if push is on.
    const alerted = await alertBrief({ briefingDate, briefType, push: payload.push });

    res.json({ ok: true, received: true, briefingDate, brief_type: briefType, date_slug: briefingDate.toISOString().slice(0, 10), itemCount: items.length, items: items.length, alerted });
  } catch (err) {
    console.error('daily-brief ingest error:', err);
    res.status(500).json({ error: 'Failed to ingest daily brief' });
  }
});

// GET /api/daily-brief/latest — the newest brief. Default view of the page.
// (Declared before /:date so "latest" isn't captured as a date.)
router.get('/latest', readLimiter, async (req, res) => {
  try {
    const type = briefTypeOf(req.query.type);
    const brief = await DailyBrief.findOne(type ? { briefType: type } : {}).sort({ briefingDate: -1, updatedAt: -1 }).lean();
    res.json({ brief: brief ? await withDiscussion(brief) : null });
  } catch (err) {
    console.error('daily-brief latest error:', err);
    res.status(500).json({ error: 'Failed to fetch latest brief' });
  }
});

// GET /api/daily-brief/list?limit=20&type= — recent briefs without their
// items (the Intelligence page and the app's dossier list).
router.get('/list', readLimiter, async (req, res) => {
  try {
    const type = briefTypeOf(req.query.type);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const rows = await DailyBrief.find(type ? { briefType: type } : {})
      .sort({ briefingDate: -1, briefType: -1 })
      .limit(limit)
      .select('-items -byDomain -contentLabels')
      .lean();
    res.set('Cache-Control', 'public, max-age=60');
    res.json({ count: rows.length, briefs: rows.map((b) => ({ ...b, dateSlug: b.briefingDate.toISOString().slice(0, 10) })) });
  } catch (err) {
    console.error('daily-brief list error:', err);
    res.status(500).json({ error: 'Failed to list briefs' });
  }
});

// GET /api/daily-brief/dates — the days that have a brief (newest first), so
// the archive calendar can enable only those days. (Declared before /:date.)
router.get('/dates', readLimiter, async (_req, res) => {
  try {
    const rows = await DailyBrief.find().sort({ briefingDate: -1 }).select('briefingDate briefType').lean();
    const dates = [...new Set(rows.map((r) => r.briefingDate.toISOString().slice(0, 10)))];
    res.json({ dates, editions: rows.map((r) => ({ date: r.briefingDate.toISOString().slice(0, 10), type: r.briefType })) });
  } catch (err) {
    console.error('daily-brief dates error:', err);
    res.status(500).json({ error: 'Failed to fetch brief dates' });
  }
});

// GET /api/daily-brief/:date[/:type] — the brief for a specific day
// (YYYY-MM-DD). With no type (or ?type=), the newest edition of that day.
router.get('/:date/:type?', readLimiter, async (req, res) => {
  try {
    const range = utcDayRange(req.params.date);
    if (!range) return res.status(400).json({ error: 'Invalid date (expected YYYY-MM-DD)' });
    const type = briefTypeOf(req.params.type || req.query.type);
    if ((req.params.type || req.query.type) && !type) return res.status(400).json({ error: 'type must be morning or evening' });

    const brief = await DailyBrief.findOne({
      briefingDate: { $gte: range.start, $lt: range.end },
      ...(type ? { briefType: type } : {}),
    }).sort({ updatedAt: -1 }).lean();
    if (!brief) return res.status(404).json({ error: 'No brief for that day' });
    res.json({ brief: await withDiscussion(brief) });
  } catch (err) {
    console.error('daily-brief fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch brief' });
  }
});

module.exports = router;
module.exports.mirrorItemsToNews = mirrorItemsToNews;
