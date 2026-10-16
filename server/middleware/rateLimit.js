const rateLimit = require('express-rate-limit');

// Human-facing auth endpoints: tight limit to slow brute-force/credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

// Machine-to-machine, API-key-protected routes: looser limit sized for n8n
// traffic, but enough to blunt key-guessing sprays.
const machineLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Comment creation: per-user (runs after requireAuth, so req.user is always
// set; req.ip is a defensive fallback only). Tight enough to blunt spam floods
// without getting in the way of an active discussion.
const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? String(req.user._id) : req.ip),
  message: { error: 'You are posting too quickly, please wait a moment' },
});

const adminSensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.user ? String(req.user._id) : req.ip),
  message: { error: 'Too many sensitive admin actions, please try again later' },
});

// Public, unauthenticated share-preview endpoint: IP-based, generous enough
// for real link opens (crawlers, chat unfurls) but bounded against scraping.
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// Public read endpoints (feed, stories, comments). Per-IP and generous —
// sized for real readers and link unfurls, bounded against scraping.
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

module.exports = {
  authLimiter,
  machineLimiter,
  commentLimiter,
  adminSensitiveLimiter,
  readLimiter,
  publicLimiter,
};
