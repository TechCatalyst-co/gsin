const express = require('express');
const User = require('../models/User');
const DeletionRequest = require('../models/DeletionRequest');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/account/deletion-request — public. Records a request to delete an
// account and its data for an admin to review and action. Rate-limited to blunt
// abuse. We never reveal whether the email maps to a real account, so the
// response is identical regardless.
router.post('/deletion-request', authLimiter, async (req, res) => {
  try {
    const { email, reason } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }

    // Best-effort account link — never blocks the request.
    const user = await User.findOne({ email: email.toLowerCase() }).select('_id');

    await DeletionRequest.create({
      email,
      reason: typeof reason === 'string' ? reason.slice(0, 1000) : undefined,
      user: user ? user._id : null,
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('deletion-request error:', err);
    res.status(500).json({ error: 'Could not submit request' });
  }
});

module.exports = router;
