const express = require('express');
const mongoose = require('mongoose');
const NewsItem = require('../models/NewsItem');
const apiKey = require('../middleware/apiKey');
const optionalAuth = require('../middleware/optionalAuth');
const { machineLimiter, readLimiter } = require('../middleware/rateLimit');
const { capabilitiesFor } = require('../utils/capabilities');
const { normalizeItem, isValid, upsertNewsItems } = require('../utils/ingest');

const router = express.Router();

const escapeRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The public wire shape. `hidden` is only exposed to staff.
function serialize(item, caps) {
  const out = { ...item, hasAnalysis: !!item.analysis };
  if (!caps.curate) delete out.hidden;
  return out;
}

// POST /api/news — n8n pushes items here (upsert by url). Key-protected.
router.post('/', machineLimiter, apiKey, async (req, res) => {
  try {
    const raw = Array.isArray(req.body) ? req.body : [req.body];
    if (!raw.length || (raw.length === 1 && (!raw[0] || !Object.keys(raw[0]).length))) {
      return res.status(400).json({ error: 'Empty payload' });
    }
    const items = raw.map(normalizeItem);
    const invalidCount = items.filter((i) => !isValid(i)).length;
    if (invalidCount) {
      return res.status(400).json({ error: 'Every item needs a title and a valid http(s) url', invalidCount });
    }
    const result = await upsertNewsItems(items);
    res.json({ ok: true, received: items.length, inserted: result.upsertedCount, updated: result.modifiedCount });
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
    const { category, tag, urgent, featured, search, since, sort = 'latest', page = 1, limit = 30 } = req.query;

    const filter = {};
    if (!caps.curate || req.query.includeHidden !== 'true') filter.hidden = { $ne: true };
    if (category) filter.category = category;
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
