const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const NewsItem = require('../models/NewsItem');
const requireAuth = require('../middleware/auth');
const { capabilitiesFor } = require('../utils/capabilities');
const { serialize } = require('./news');

// Reader personalization: bookmarks ("Saved") and followed categories ("For you").
const router = express.Router();
router.use(requireAuth);

// GET /api/me/bookmarks
router.get('/bookmarks', async (req, res) => {
  try {
    const caps = capabilitiesFor(req.user);
    const ids = (req.user.bookmarks || []).slice(-200);
    const items = await NewsItem.find({ _id: { $in: ids }, hidden: { $ne: true } }).lean();
    // Most recently saved first.
    const order = new Map(ids.map((id, i) => [String(id), i]));
    items.sort((a, b) => order.get(String(b._id)) - order.get(String(a._id)));
    res.json({ items: items.map((i) => ({ ...serialize(i, caps), bookmarked: true })) });
  } catch (err) {
    console.error('bookmarks error:', err);
    res.status(500).json({ error: 'Failed to fetch saved stories' });
  }
});

// POST /api/me/bookmarks — { newsItem, saved: boolean }. POST for both
// directions so the mobile GET/POST wrapper can toggle.
router.post('/bookmarks', async (req, res) => {
  try {
    const { newsItem, saved = true } = req.body || {};
    if (!mongoose.isValidObjectId(newsItem)) return res.status(400).json({ error: 'Invalid story id' });
    if (saved && !(await NewsItem.exists({ _id: newsItem }))) return res.status(404).json({ error: 'Story not found' });
    await User.updateOne(
      { _id: req.user._id },
      saved ? { $addToSet: { bookmarks: newsItem } } : { $pull: { bookmarks: newsItem } }
    );
    res.json({ ok: true, saved: !!saved });
  } catch (err) {
    console.error('bookmark toggle error:', err);
    res.status(500).json({ error: 'Failed to update saved stories' });
  }
});

// PUT /api/me/preferences — { briefEmails: boolean }
router.put('/preferences', async (req, res) => {
  try {
    const { briefEmails } = req.body || {};
    if (typeof briefEmails !== 'boolean') return res.status(400).json({ error: 'briefEmails must be true or false' });
    await User.updateOne({ _id: req.user._id }, { $set: { briefEmails } });
    res.json({ ok: true, briefEmails });
  } catch (err) {
    console.error('preferences update error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// PUT /api/me/categories — { categories: string[] }
router.put('/categories', async (req, res) => {
  try {
    const list = Array.isArray(req.body?.categories) ? req.body.categories : null;
    if (!list) return res.status(400).json({ error: 'categories must be an array' });
    const clean = [...new Set(list.filter((c) => typeof c === 'string').map((c) => c.trim().slice(0, 80)).filter(Boolean))].slice(0, 30);
    await User.updateOne({ _id: req.user._id }, { $set: { followedCategories: clean } });
    res.json({ ok: true, followedCategories: clean });
  } catch (err) {
    console.error('categories update error:', err);
    res.status(500).json({ error: 'Failed to update followed topics' });
  }
});

// GET /api/me/feed — latest stories in followed categories.
router.get('/feed', async (req, res) => {
  try {
    const caps = capabilitiesFor(req.user);
    const cats = req.user.followedCategories || [];
    if (!cats.length) return res.json({ items: [], followedCategories: [] });
    const items = await NewsItem.find({ category: { $in: cats }, hidden: { $ne: true } })
      .sort({ published: -1 }).limit(50).lean();
    res.json({ items: items.map((i) => serialize(i, caps)), followedCategories: cats });
  } catch (err) {
    console.error('personal feed error:', err);
    res.status(500).json({ error: 'Failed to fetch your feed' });
  }
});

module.exports = router;
