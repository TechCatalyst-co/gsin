const express = require('express');
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const NewsItem = require('../models/NewsItem');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { commentLimiter, readLimiter } = require('../middleware/rateLimit');
const { cleanBody } = require('../utils/text');
const { capabilitiesFor, requireCapability } = require('../utils/capabilities');

const router = express.Router();

function badgeFor(user) {
  if (user.isStaff()) return 'staff';
  return user.hasAccess() ? 'premium' : 'member';
}

function isBlocked(user, authorId) {
  return !!user && (user.blockedUsers || []).some((id) => id.equals(authorId));
}

// The wire shape both clients consume. Removed/hidden comments keep their
// place in the tree but carry no body or author.
function serialize(comment, user) {
  const removed = comment.status === 'removed';
  const hidden = !removed && isBlocked(user, comment.author);
  const redacted = removed || hidden;
  return {
    _id: comment._id,
    newsItem: comment.newsItem,
    parent: comment.parent,
    authorId: redacted ? null : comment.author,
    authorName: redacted ? null : comment.authorName,
    authorBadge: redacted ? null : comment.authorBadge,
    body: redacted ? null : comment.body,
    status: comment.status,
    hidden,
    createdAt: comment.createdAt,
    isMine: !!user && user._id.equals(comment.author),
    reportedByMe: !!user && (comment.reports || []).some((r) => r.user && user._id.equals(r.user)),
  };
}

function rejectIfBanned(req, res) {
  if (req.user.banned) {
    res.status(403).json({ error: 'Your account is not allowed to post' });
    return true;
  }
  return false;
}

// GET /api/comments?newsItem=<id> — PUBLIC. Flat list; clients build the tree.
router.get('/', readLimiter, optionalAuth, async (req, res) => {
  try {
    const { newsItem } = req.query;
    if (!mongoose.isValidObjectId(newsItem)) return res.status(400).json({ error: 'Invalid story id' });
    const comments = await Comment.find({ newsItem }).sort({ createdAt: 1 }).limit(500).lean();
    const caps = capabilitiesFor(req.user);
    res.json({
      comments: comments.map((c) => serialize(c, req.user)),
      total: comments.length,
      canPost: caps.participateInThreads,
    });
  } catch (err) {
    console.error('comments fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/comments — { newsItem, body, parent? }
router.post('/', requireAuth, requireCapability('participateInThreads'), commentLimiter, async (req, res) => {
  try {
    if (rejectIfBanned(req, res)) return;
    const { newsItem, parent } = req.body || {};
    const body = cleanBody(req.body?.body, 2000);
    if (!body) return res.status(400).json({ error: 'Comment must be 1–2000 characters of text' });
    if (!mongoose.isValidObjectId(newsItem)) return res.status(400).json({ error: 'Invalid story id' });

    const story = await NewsItem.findById(newsItem).select('_id hidden').lean();
    if (!story || story.hidden) return res.status(404).json({ error: 'Story not found' });

    let parentId = null;
    if (parent != null) {
      if (!mongoose.isValidObjectId(parent)) return res.status(400).json({ error: 'Invalid parent comment id' });
      const parentComment = await Comment.findById(parent).select('newsItem').lean();
      if (!parentComment || String(parentComment.newsItem) !== String(newsItem)) {
        return res.status(400).json({ error: 'Parent comment does not belong to this story' });
      }
      parentId = parent;
    }

    const comment = await Comment.create({
      newsItem,
      parent: parentId,
      author: req.user._id,
      authorName: req.user.name || req.user.email.split('@')[0],
      authorBadge: badgeFor(req.user),
      body,
    });
    await NewsItem.updateOne({ _id: newsItem }, { $inc: { commentCount: 1 } });
    res.status(201).json({ comment: serialize(comment, req.user) });
  } catch (err) {
    console.error('comment create error:', err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// POST /api/comments/block | /unblock — hide an author's comments (App Store 1.2).
router.post('/block', requireAuth, async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid user id' });
    if (req.user._id.equals(userId)) return res.status(400).json({ error: 'You cannot block yourself' });
    await User.updateOne({ _id: req.user._id }, { $addToSet: { blockedUsers: userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('block error:', err);
    res.status(500).json({ error: 'Failed to block user' });
  }
});

router.post('/unblock', requireAuth, async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ error: 'Invalid user id' });
    await User.updateOne({ _id: req.user._id }, { $pull: { blockedUsers: userId } });
    res.json({ ok: true });
  } catch (err) {
    console.error('unblock error:', err);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
});

// DELETE /api/comments/:id — author or staff. Soft delete.
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid comment id' });
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const isAuthor = req.user._id.equals(comment.author);
    if (!isAuthor && !req.user.isStaff()) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }
    if (comment.status === 'visible') {
      comment.status = 'removed';
      comment.removedBy = isAuthor ? 'author' : 'admin';
      await comment.save();
      await NewsItem.updateOne({ _id: comment.newsItem }, { $inc: { commentCount: -1 } });
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('comment delete error:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// POST /api/comments/:id/report — any signed-in reader; idempotent per user.
router.post('/:id/report', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid comment id' });
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : undefined;
    await Comment.updateOne(
      { _id: id, status: 'visible', 'reports.user': { $ne: req.user._id } },
      { $push: { reports: { user: req.user._id, reason } }, $inc: { reportCount: 1 } }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('comment report error:', err);
    res.status(500).json({ error: 'Failed to report comment' });
  }
});

module.exports = router;
