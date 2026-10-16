const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const { capabilitiesFor } = require('../utils/capabilities');

const user = (fields = {}) => new User({ email: 'member@example.com', passwordHash: 'unused', ...fields });

test('everyone reads everything for free, no account needed', () => {
  const caps = capabilitiesFor(null);
  assert.equal(caps.readNews, true);
  assert.equal(caps.readAnalysis, true);
  assert.equal(caps.accessDailyBrief, true);
  assert.equal(caps.viewThreads, true);
  assert.equal(caps.participateInThreads, false);
});

test('a signed-in reader can post but not curate', () => {
  const caps = capabilitiesFor(user());
  assert.equal(caps.participateInThreads, true);
  assert.equal(caps.curate, false);
  assert.equal(caps.manageMembers, false);
});

test('staff curate; only admins manage members', () => {
  assert.equal(capabilitiesFor(user({ role: 'editor' })).curate, true);
  assert.equal(capabilitiesFor(user({ role: 'editor' })).manageMembers, false);
  assert.equal(capabilitiesFor(user({ role: 'admin' })).manageMembers, true);
});

test('toPublic has no billing fields and defaults brief emails on', () => {
  const json = user().toPublic();
  assert.equal(json.briefEmails, true);
  for (const k of ['subscriptionStatus', 'hasAccess', 'isPremium', 'currentPeriodEnd']) assert.equal(json[k], undefined);
});
