const express = require('express');
const User = require('../models/User');
const apiKey = require('../middleware/apiKey');
const { machineLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// GET /api/subscribers — key-protected. n8n calls this for the Daily Brief
// email: every non-banned account that has brief emails turned on.
router.get('/', machineLimiter, apiKey, async (_req, res) => {
  try {
    const users = await User.find({ banned: { $ne: true }, briefEmails: { $ne: false } })
      .select('name email')
      .lean();
    res.json({
      count: users.length,
      subscribers: users.map((u) => ({ name: u.name, email: u.email })),
    });
  } catch (err) {
    console.error('subscribers error:', err);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

module.exports = router;
