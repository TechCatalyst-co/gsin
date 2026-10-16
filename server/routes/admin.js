const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('../models/User');
const AdminAuditEvent = require('../models/AdminAuditEvent');
const Comment = require('../models/Comment');
const NewsItem = require('../models/NewsItem');
const DailyBrief = require('../models/DailyBrief');
const requireAuth = require('../middleware/auth');
const { adminSensitiveLimiter } = require('../middleware/rateLimit');
const { alertBreaking } = require('../utils/push');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['member', 'editor', 'admin'];
const escapeRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function temporaryPassword() {
  return `${crypto.randomBytes(12).toString('base64url')}!9a`;
}

function adminUser(user) {
  return {
    ...user.toPublic(),
    banned: user.banned,
    createdAt: user.createdAt,
  };
}

const requireStaff = (req, res, next) =>
  req.user?.isStaff() ? next() : res.status(403).json({ error: 'Staff access required' });
const requireAdmin = (req, res, next) =>
  req.user?.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access required' });

// Editors and admins reach this router; member management is admin-only below.
router.use(requireAuth, requireStaff);

// ---------------------------------------------------------------- metrics
router.get('/metrics', async (_req, res) => {
  try {
    const days = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
    const [
      totalMembers, briefSubscribers, newMembers30d,
      totalStories, stories24h, stories7d, breaking24h,
      totalComments, comments7d, openReports,
      briefs, latestBrief, topStories, byCategory,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ banned: { $ne: true }, briefEmails: { $ne: false } }),
      User.countDocuments({ createdAt: { $gte: days(30) } }),
      NewsItem.countDocuments(),
      NewsItem.countDocuments({ createdAt: { $gte: days(1) } }),
      NewsItem.countDocuments({ createdAt: { $gte: days(7) } }),
      NewsItem.countDocuments({ urgent: true, published: { $gte: days(1) } }),
      Comment.countDocuments({ status: 'visible' }),
      Comment.countDocuments({ status: 'visible', createdAt: { $gte: days(7) } }),
      Comment.countDocuments({ status: 'visible', reportCount: { $gt: 0 } }),
      DailyBrief.countDocuments(),
      DailyBrief.findOne().sort({ briefingDate: -1 }).select('briefingDate briefingDateLabel').lean(),
      NewsItem.find({ commentCount: { $gt: 0 } }).sort({ commentCount: -1 }).limit(5)
        .select('title slug category commentCount published').lean(),
      NewsItem.aggregate([
        { $match: { createdAt: { $gte: days(7) } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).then((rows) => rows.map((r) => ({ category: r._id || 'Uncategorized', count: r.count }))),
    ]);
    // Last ingest time doubles as an n8n pipeline health check.
    const lastIngest = await NewsItem.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
    res.json({
      totalMembers, briefSubscribers, newMembers30d,
      totalStories, stories24h, stories7d, breaking24h,
      totalComments, comments7d, openReports,
      briefs, latestBrief, topStories, byCategory,
      lastIngestAt: lastIngest?.updatedAt || null,
    });
  } catch (err) {
    console.error('admin metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// ------------------------------------------------------------- newsroom
// GET /api/admin/news?search=&page=&filter=hidden|featured|urgent
router.get('/news', async (req, res) => {
  try {
    const { search, page = 1, filter: f } = req.query;
    const filter = {};
    if (search) {
      const rx = new RegExp(escapeRx(search), 'i');
      filter.$or = [{ title: rx }, { source: rx }, { category: rx }];
    }
    if (['hidden', 'featured', 'urgent'].includes(f)) filter[f] = true;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = 30;
    const [items, total] = await Promise.all([
      NewsItem.find(filter).sort({ published: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize)
        .select('title slug url source category published urgent featured hidden commentCount').lean(),
      NewsItem.countDocuments(filter),
    ]);
    res.json({ items, pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (err) {
    console.error('admin news error:', err);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// PATCH /api/admin/news/:id — { featured?, hidden?, urgent?, category? }
router.patch('/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid story id' });
    const update = {};
    for (const k of ['featured', 'hidden', 'urgent']) {
      if (typeof req.body?.[k] === 'boolean') update[k] = req.body[k];
    }
    if (typeof req.body?.category === 'string') update.category = req.body.category.trim().slice(0, 80);
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update' });
    const item = await NewsItem.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!item) return res.status(404).json({ error: 'Story not found' });
    await AdminAuditEvent.create({ actor: req.user._id, action: 'story.curated', after: { story: id, ...update } });
    // Flagging breaking (or un-hiding a breaking story) sends the push alert.
    if (item.urgent && !item.hidden && !item.alertedAt) await alertBreaking({ _id: item._id });
    res.json({ item });
  } catch (err) {
    console.error('admin news update error:', err);
    res.status(500).json({ error: 'Failed to update story' });
  }
});

// ----------------------------------------------------------- moderation
router.get('/comments/reported', async (_req, res) => {
  try {
    const comments = await Comment.find({ reportCount: { $gt: 0 }, status: 'visible' })
      .sort({ reportCount: -1, createdAt: -1 }).limit(100).lean();
    const ids = [...new Set(comments.map((c) => String(c.newsItem)))];
    const stories = await NewsItem.find({ _id: { $in: ids } }).select('title slug').lean();
    const byId = Object.fromEntries(stories.map((a) => [String(a._id), a]));
    res.json({
      comments: comments.map((c) => ({
        _id: c._id,
        newsItem: c.newsItem,
        articleTitle: byId[String(c.newsItem)]?.title || '(story removed)',
        articleSlug: byId[String(c.newsItem)]?.slug || null,
        authorId: c.author,
        authorName: c.authorName,
        body: c.body,
        createdAt: c.createdAt,
        reportCount: c.reportCount,
        reports: c.reports,
      })),
    });
  } catch (err) {
    console.error('admin reported error:', err);
    res.status(500).json({ error: 'Failed to fetch reported comments' });
  }
});

router.post('/comments/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid comment id' });
    const result = await Comment.updateOne({ _id: id }, { $set: { reports: [], reportCount: 0 } });
    if (!result.matchedCount) return res.status(404).json({ error: 'Comment not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('admin dismiss error:', err);
    res.status(500).json({ error: 'Failed to dismiss reports' });
  }
});

// -------------------------------------------------------------- members
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { search, page = 1 } = req.query;
    const filter = {};
    if (search) {
      const rx = new RegExp(escapeRx(search), 'i');
      filter.$or = [{ email: rx }, { name: rx }];
    }
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = 25;
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * pageSize).limit(pageSize),
      User.countDocuments(filter),
    ]);
    res.json({
      users: users.map(adminUser),
      pagination: { page: pageNum, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    console.error('admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users', requireAdmin, adminSensitiveLimiter, async (req, res) => {
  try {
    const { name, email, role = 'member' } = req.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_RE.test(normalizedEmail)) return res.status(400).json({ error: 'A valid email is required' });
    if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const password = temporaryPassword();
    const user = new User({
      name: typeof name === 'string' ? name.trim().slice(0, 120) : undefined,
      email: normalizedEmail,
      role,
      mustChangePassword: true,
    });
    user.password = password;
    await user.save();
    await AdminAuditEvent.create({
      actor: req.user._id, target: user._id, action: 'user.created',
      after: { email: user.email, role: user.role },
    });
    res.status(201).json({ user: adminUser(user), temporaryPassword: password });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'An account with this email already exists' });
    console.error('admin user create error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.post('/users/:id/reset-password', requireAdmin, adminSensitiveLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user id' });
    if (req.user._id.equals(id)) return res.status(400).json({ error: 'Use account settings to change your own password' });
    const user = await User.findById(id).select('+authVersion');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const password = temporaryPassword();
    user.password = password;
    user.mustChangePassword = true;
    user.authVersion = (user.authVersion || 0) + 1;
    await user.save();
    await AdminAuditEvent.create({ actor: req.user._id, target: user._id, action: 'password.reset' });
    res.json({ ok: true, temporaryPassword: password });
  } catch (err) {
    console.error('admin password reset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// PATCH /api/admin/users/:id — { banned?, role? }
router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user id' });
    const { banned, role } = req.body || {};
    const update = {};
    if (typeof banned === 'boolean') update.banned = banned;
    if (role !== undefined) {
      if (!ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
      update.role = role;
    }
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update' });
    if (req.user._id.equals(id) && (update.banned === true || (update.role && update.role !== 'admin'))) {
      return res.status(400).json({ error: 'You cannot ban or demote your own account' });
    }
    if (update.banned === true || (update.role && update.role !== 'admin')) {
      const target = await User.findById(id).select('role banned');
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (target.role === 'admin' && !target.banned) {
        const activeAdmins = await User.countDocuments({ role: 'admin', banned: { $ne: true } });
        if (activeAdmins <= 1) return res.status(400).json({ error: 'You cannot disable the last active admin account' });
      }
    }
    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: adminUser(user) });
  } catch (err) {
    console.error('admin user update error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;
