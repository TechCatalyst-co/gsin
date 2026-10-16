const express = require('express');
const User = require('../models/User');
const apiKey = require('../middleware/apiKey');
const { machineLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// GET /api/subscribers  — key-protected. n8n calls this to get the list of
// eligible paying members to email the briefing to. Returns minimal fields only.
router.get('/', machineLimiter, apiKey, async (req, res) => {
  try {
    // ?audience=premium (default) → Daily Brief newsletter recipients.
    // ?audience=all → every non-banned account (e.g. a free weekly digest).
    const audience = req.query.audience === 'all' ? 'all' : 'premium';
    const filter = audience === 'all'
      ? { banned: { $ne: true } }
      : { $or: [User.activeAccessFilter(), { role: { $in: ['editor', 'admin'] } }] };
    const users = await User.find(filter).select('name email').lean();
    res.json({
      audience,
      count: users.length,
      subscribers: users.map((u) => ({ name: u.name, email: u.email })),
    });
  } catch (err) {
    console.error('subscribers error:', err);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

module.exports = router;
