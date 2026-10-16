const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Mobile clients send the token as an Authorization: Bearer header; the web
// client uses the HttpOnly cookie. Bearer takes precedence when both exist.
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return req.cookies && req.cookies.token;
}

// Verifies the token and attaches the full user document to req.user
module.exports = async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('+authVersion');
    if (!user) return res.status(401).json({ error: 'Account no longer exists' });
    if ((payload.v ?? 0) !== (user.authVersion ?? 0)) {
      return res.status(401).json({ error: 'Session has been invalidated' });
    }

    req.user = user;
    // Version-agnostic so the allow-list matches both `/api/auth/...` and
    // `/api/v1/auth/...` (and any future `/api/vN/...`).
    const passwordChangeAllowed =
      /^\/api(?:\/v\d+)?\/auth\/(me|logout|change-password)$/.test(
        req.originalUrl.split('?')[0]
      );
    if (user.mustChangePassword && !passwordChangeAllowed) {
      return res.status(403).json({
        error: 'You must change your temporary password before continuing',
        code: 'password_change_required',
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};
