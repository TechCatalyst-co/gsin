const express = require('express');
const mongoose = require('mongoose');
const NewsItem = require('../models/NewsItem');
const apiKey = require('../middleware/apiKey');
const optionalAuth = require('../middleware/optionalAuth');
const { machineLimiter, readLimiter } = require('../middleware/rateLimit');
const { capabilitiesFor } = require('../utils/capabilities');
const { normalizeItem, isValid, upsertNewsItems } = require('../utils/ingest');
const { alertBreaking } = require('../utils/push');
const DailyBrief = require('../models/DailyBrief');

const SOURCE_COUNT = parseInt(process.env.RADAR_SOURCE_COUNT, 10) || 34;

const router = express.Router();

const escapeRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The public wire shape. `hidden` is only exposed to staff.
function serialize(item, caps) {
  const out = { ...item, hasAnalysis: !!item.analysis };
  if (!caps.curate) delete out.hidden;
  return out;
}

// The body is one item, an array of items, or the Global SI Radar's envelope
// ({ kind: 'radar_breaking', push, 'app-items': [...] }). Only the items are
// stored; the envelope's email/push fields are n8n's own.
function unwrapItems(body) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== 'object') return [];
  for (const key of ['app-items', 'app_items', 'items']) {
    if (Array.isArray(body[key])) return body[key];
  }
  return [body];
}

// POST /api/news — n8n pushes items here (upsert by url). Key-protected.
router.post('/', machineLimiter, apiKey, async (req, res) => {
  try {
    const raw = unwrapItems(req.body);
    if (!raw.length || (raw.length === 1 && (!raw[0] || !Object.keys(raw[0]).length))) {
      return res.status(400).json({ error: 'Empty payload' });
    }
    const items = raw.map(normalizeItem);
    const invalidCount = items.filter((i) => !isValid(i)).length;
    if (invalidCount) {
      return res.status(400).json({ error: 'Every item needs a title and a valid http(s) url', invalidCount });
    }
    const result = await upsertNewsItems(items);
    const alerted = await alertBreaking({ url: { $in: items.map((i) => i.url) } });
    res.json({ ok: true, received: items.length, inserted: result.upsertedCount, updated: result.modifiedCount, alerted });
  } catch (err) {
    console.error('ingest error:', err);
    res.status(500).json({ error: 'Failed to ingest items' });
  }
});

// GET /api/news — PUBLIC feed. Filters: category, tag, urgent, featured,
// search, since (ISO date). sort=latest|discussed.
router.get('/', readLimiter, optionalAuth, async (req, res) => {
  try {
    const caps = capabilitiesFor(req.user);
    const { category, domain, tier, horizon, tag, urgent, featured, search, since, hours, sort = 'latest', page = 1, limit = 30 } = req.query;

    const filter = {};
    if (!caps.curate || req.query.includeHidden !== 'true') filter.hidden = { $ne: true };
    // `domain` is the Global SI name for the desk; several may be passed.
    const desks = [].concat(category || [], domain || []).filter(Boolean);
    if (desks.length === 1) filter.category = desks[0];
    else if (desks.length > 1) filter.category = { $in: desks };
    // Global SI grading filters: tier (at most), horizon, and a rolling window.
    const maxTier = parseInt(tier, 10);
    if (maxTier >= 1 && maxTier <= 4) filter.urgencyTier = { $lte: maxTier };
    if (horizon) filter.horizon = String(horizon);
    const hrs = parseInt(hours, 10);
    if (hrs > 0) filter.published = { $gte: new Date(Date.now() - hrs * 3600 * 1000) };
    if (tag) filter.tags = String(tag).toLowerCase();
    if (urgent === 'true') filter.urgent = true;
    if (featured === 'true') filter.featured = true;
    if (since) {
      const d = new Date(since);
      if (!Number.isNaN(d.getTime())) filter.published = { $gte: d };
    }
    if (search) {
      const rx = new RegExp(escapeRx(search), 'i');
      filter.$or = [{ title: rx }, { headline: rx }, { summary: rx }, { tags: rx }, { source: rx }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const sortSpec = sort === 'discussed'
      ? { commentCount: -1, published: -1 }
      : sort === 'signal'
        ? { urgencyTier: 1, signalScore: -1, published: -1 }
        : { published: -1, createdAt: -1 };

    const [items, total] = await Promise.all([
      NewsItem.find(filter).sort(sortSpec).skip((pageNum - 1) * pageSize).limit(pageSize).lean(),
      NewsItem.countDocuments(filter),
    ]);

    res.set('Cache-Control', req.user ? 'private, no-store' : 'public, max-age=60');
    res.json({
      items: items.map((i) => serialize(i, caps)),
      pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    console.error('fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET /api/news/front-page — everything the homepage needs in one call:
// breaking items, the lead story, featured picks, latest, and most discussed.
router.get('/front-page', readLimiter, optionalAuth, async (req, res) => {
  try {
    const caps = capabilitiesFor(req.user);
    const visible = { hidden: { $ne: true } };
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [breaking, featured, latest, discussed] = await Promise.all([
      NewsItem.find({ ...visible, urgent: true, published: { $gte: dayAgo } }).sort({ published: -1 }).limit(3).lean(),
      NewsItem.find({ ...visible, featured: true }).sort({ published: -1 }).limit(4).lean(),
      NewsItem.find(visible).sort({ published: -1, createdAt: -1 }).limit(24).lean(),
      NewsItem.find({ ...visible, commentCount: { $gt: 0 }, published: { $gte: weekAgo } }).sort({ commentCount: -1 }).limit(5).lean(),
    ]);

    // Lead: newest editors' pick, else the newest breaking story, else the
    // latest story.
    const lead = featured[0] || breaking[0] || latest[0] || null;
    const leadId = lead && String(lead._id);
    const s = (arr) => arr.filter((i) => String(i._id) !== leadId).map((i) => serialize(i, caps));

    res.set('Cache-Control', req.user ? 'private, no-store' : 'public, max-age=60');
    res.json({
      breaking: breaking.map((i) => serialize(i, caps)),
      lead: lead ? serialize(lead, caps) : null,
      featured: s(featured),
      latest: s(latest),
      mostDiscussed: discussed.map((i) => serialize(i, caps)),
    });
  } catch (err) {
    console.error('front-page error:', err);
    res.status(500).json({ error: 'Failed to fetch front page' });
  }
});

// GET /api/news/status — what the radar is doing right now (the live strip on
// every page of the web and app). Public, cached a minute.
router.get('/status', readLimiter, async (_req, res) => {
  try {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const visible = { hidden: { $ne: true } };
    const [last, stories24h, breaking24h, latestBrief] = await Promise.all([
      NewsItem.findOne(visible).sort({ capturedAt: -1, createdAt: -1 }).select('capturedAt createdAt').lean(),
      NewsItem.countDocuments({ ...visible, published: { $gte: dayAgo }, $or: [{ urgencyTier: { $lte: 3 } }, { urgencyTier: null }] }),
      NewsItem.countDocuments({ ...visible, urgent: true, published: { $gte: dayAgo } }),
      DailyBrief.findOne().sort({ briefingDate: -1, updatedAt: -1 }).select('generatedAt updatedAt briefType briefingDate').lean(),
    ]);
    res.set('Cache-Control', 'public, max-age=60');
    res.json({
      source_count: SOURCE_COUNT,
      last_capture_at: last ? (last.capturedAt || last.createdAt) : null,
      stories_24h: stories24h,
      breaking_24h: breaking24h,
      latest_brief_at: latestBrief ? (latestBrief.generatedAt || latestBrief.updatedAt) : null,
      latest_brief_type: latestBrief ? latestBrief.briefType : null,
    });
  } catch (err) {
    console.error('status error:', err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// GET /api/news/story/:storyKey — every capture of one underlying story. The
// lead is the primary-source capture with the highest signal; the rest are
// other outlets' coverage (echoes). Public.
router.get('/story/:storyKey', readLimiter, optionalAuth, async (req, res) => {
  try {
    const caps = capabilitiesFor(req.user);
    const key = String(req.params.storyKey || '').slice(0, 200);
    const captures = await NewsItem.find({ storyKey: key, hidden: { $ne: true } })
      .sort({ primarySource: -1, signalScore: -1, published: -1 })
      .limit(20)
      .lean();
    if (!captures.length) return res.status(404).json({ error: 'Story not found' });
    res.set('Cache-Control', req.user ? 'private, no-store' : 'public, max-age=60');
    res.json({ lead: serialize(captures[0], caps), captures: captures.map((c) => serialize(c, caps)) });
  } catch (err) {
    console.error('story group error:', err);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// GET /api/news/categories — public, for navigation.
router.get('/categories', readLimiter, async (_req, res) => {
  try {
    const categories = await NewsItem.aggregate([
      { $match: { hidden: { $ne: true }, category: { $nin: [null, ''] } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).then((rows) => rows.map((r) => ({ category: r._id, count: r.count })));
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ categories });
  } catch (err) {
    console.error('categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/news/tags — trending tags over the last 7 days.
router.get('/tags', readLimiter, async (_req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const tags = await NewsItem.aggregate([
      { $match: { hidden: { $ne: true }, published: { $gte: weekAgo } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]).then((rows) => rows.map((r) => ({ tag: r._id, count: r.count })));
    res.set('Cache-Control', 'public, max-age=300');
    res.json({ tags });
  } catch (err) {
    console.error('tags error:', err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/news/:idOrSlug — single story plus related stories.
router.get('/:idOrSlug', readLimiter, optionalAuth, async (req, res) => {
  try {
    const caps = capabilitiesFor(req.user);
    const { idOrSlug } = req.params;
    const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
    const item = await NewsItem.findOne(query).lean();
    if (!item || (item.hidden && !caps.curate)) return res.status(404).json({ error: 'Story not found' });

    const relatedFilter = { _id: { $ne: item._id }, hidden: { $ne: true } };
    if (item.tags?.length) relatedFilter.$or = [{ tags: { $in: item.tags } }, { category: item.category }];
    else if (item.category) relatedFilter.category = item.category;
    const related = await NewsItem.find(relatedFilter).sort({ published: -1 }).limit(4).lean();

    const bookmarked = !!req.user && (req.user.bookmarks || []).some((b) => b.equals(item._id));
    res.set('Cache-Control', req.user ? 'private, no-store' : 'public, max-age=60');
    res.json({
      item: { ...serialize(item, caps), bookmarked },
      related: related.map((r) => serialize(r, caps)),
    });
  } catch (err) {
    console.error('fetch item error:', err);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

module.exports = router;
module.exports.serialize = serialize;
