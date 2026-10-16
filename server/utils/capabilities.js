// The access policy, in one place. Both clients read the resolved object from
// /auth/me so neither duplicates the rules.
//
//   everyone (no account) : every story, analysis, the Daily Brief, discussions
//   signed-in reader       : + post in discussions, save stories, follow topics
//   editor / admin         : + curate the feed and moderate (admin: members too)
//
// Everything is free. Revenue comes from ads (see docs/ADS.md).
const PUBLIC = {
  readNews: true,
  viewThreads: true,
  accessDailyBrief: true,
  readAnalysis: true,
  participateInThreads: false,
  curate: false,
  manageMembers: false,
};

function capabilitiesFor(user) {
  if (!user) return { ...PUBLIC };
  return {
    ...PUBLIC,
    participateInThreads: true,
    curate: user.isStaff(),
    manageMembers: user.role === 'admin',
  };
}

const MESSAGES = {
  participateInThreads: 'Sign in to join the discussion',
  curate: 'Staff access required',
  manageMembers: 'Admin access required',
};

// Middleware factory. Runs after requireAuth.
function requireCapability(name) {
  return (req, res, next) => {
    req.capabilities = capabilitiesFor(req.user);
    if (!req.capabilities[name]) {
      return res.status(403).json({ error: MESSAGES[name] || 'You do not have access to this feature', code: 'forbidden' });
    }
    next();
  };
}

module.exports = { capabilitiesFor, requireCapability };
