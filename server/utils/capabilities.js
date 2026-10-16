// The access policy, in one place. Both clients read the resolved object from
// /auth/me so neither duplicates the rules.
//
//   anonymous / free account : read every story, read every discussion
//   Premium (paid or comped) : + Daily Brief, deep analysis, posting
//   editor / admin           : everything (staff)
//
// Set COMMENTS_FREE=true to let free accounts post too.
const FREE = {
  readNews: true,
  viewThreads: true,
  accessDailyBrief: false,
  readAnalysis: false,
  participateInThreads: false,
  curate: false,
  manageMembers: false,
};

function capabilitiesFor(user) {
  if (!user) return { ...FREE };
  const premium = user.isPremium();
  const freeComments = process.env.COMMENTS_FREE === 'true';
  return {
    ...FREE,
    accessDailyBrief: premium,
    readAnalysis: premium,
    participateInThreads: premium || freeComments,
    curate: user.isStaff(),
    manageMembers: user.role === 'admin',
  };
}

const UPGRADE_MESSAGES = {
  accessDailyBrief: 'Upgrade to Premium to read the Daily Brief',
  readAnalysis: 'Upgrade to Premium to read the full analysis',
  participateInThreads: 'Upgrade to Premium to join the discussion',
};

// Middleware factory. Runs after requireAuth.
function requireCapability(name) {
  return (req, res, next) => {
    req.capabilities = capabilitiesFor(req.user);
    if (!req.capabilities[name]) {
      return res.status(403).json({
        error: UPGRADE_MESSAGES[name] || 'You do not have access to this feature',
        code: UPGRADE_MESSAGES[name] ? 'upgrade_required' : 'forbidden',
      });
    }
    next();
  };
}

module.exports = { capabilitiesFor, requireCapability };
