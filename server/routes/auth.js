const express = require('express');
const jwt = require('jsonwebtoken');
const ms = require('ms');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { capabilitiesFor } = require('../utils/capabilities');

// The wire shape for the signed-in user: the public profile plus the resolved
// capabilities, so neither client duplicates the access rules.
function publicUserWithCapabilities(user) {
  return { ...user.toPublic(), capabilities: capabilitiesFor(user) };
}

const router = express.Router();

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
// Mobile clients can't refresh as easily as the web app, so they opt into a
// longer-lived token via `client: 'mobile'` in the login/register body.
const JWT_MOBILE_EXPIRES_IN = process.env.JWT_MOBILE_EXPIRES_IN || '30d';

function signToken(user, mobile = false) {
  return jwt.sign({ id: user._id, v: user.authVersion ?? 0 }, process.env.JWT_SECRET, {
    expiresIn: mobile ? JWT_MOBILE_EXPIRES_IN : JWT_EXPIRES_IN,
  });
}

// HttpOnly so client-side JS (and XSS) can never read the token.
function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: (process.env.CLIENT_URL || '').startsWith('https://'),
    sameSite: 'lax',
    maxAge: ms(JWT_EXPIRES_IN),
  });
}

function clearAuthCookie(res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: (process.env.CLIENT_URL || '').startsWith('https://'),
    sameSite: 'lax',
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const user = new User({ name: typeof name === 'string' ? name.trim().slice(0, 120) : undefined, email });
    user.password = password; // hashed by the pre-save hook


    await user.save();

    const token = signToken(user, req.body?.client === 'mobile');
    setAuthCookie(res, token);
    res.status(201).json({ user: publicUserWithCapabilities(user), token });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Could not create account' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +authVersion');
    if (!user) return res.status(401).json({ error: 'Incorrect email or password' });

    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'Incorrect email or password' });

    const token = signToken(user, req.body?.client === 'mobile');
    setAuthCookie(res, token);
    res.json({ user: publicUserWithCapabilities(user), token });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Could not sign in' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json({ user: publicUserWithCapabilities(req.user) });
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ error: 'Could not load account' });
  }
});

// POST /api/auth/change-password — completes a temporary-password login.
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const user = await User.findById(req.user._id).select('+passwordHash +authVersion');
    if (!user || !(await user.verifyPassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    user.password = newPassword;
    user.mustChangePassword = false;
    user.authVersion = (user.authVersion || 0) + 1;
    await user.save();

    const mobile = req.body?.client === 'mobile';
    const token = signToken(user, mobile);
    setAuthCookie(res, token);
    res.json({ user: publicUserWithCapabilities(user), token });
  } catch (err) {
    console.error('change password error:', err);
    res.status(500).json({ error: 'Could not change password' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

module.exports = router;
