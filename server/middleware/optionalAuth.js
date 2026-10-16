const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Like requireAuth, but never rejects: public routes use it to personalize
// (premium fields, isMine flags) when a valid session is present.
module.exports = async function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : req.cookies && req.cookies.token;
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('+authVersion');
    if (user && (payload.v ?? 0) === (user.authVersion ?? 0) && !user.mustChangePassword) {
      req.user = user;
    }
  } catch {
    /* invalid/expired token → treat as anonymous */
  }
  next();
};
