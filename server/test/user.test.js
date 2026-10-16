const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const { capabilitiesFor } = require('../utils/capabilities');

const user = (fields = {}) => new User({ email: 'member@example.com', passwordHash: 'unused', ...fields });

test('anonymous and free readers can read but not use Premium features', () => {
  for (const caps of [capabilitiesFor(null), capabilitiesFor(user())]) {
    assert.equal(caps.readNews, true);
    assert.equal(caps.viewThreads, true);
    assert.equal(caps.accessDailyBrief, false);
    assert.equal(caps.participateInThreads, false);
  }
});

test('active or trialing subscription unlocks Premium', () => {
  for (const status of ['active', 'trialing']) {
    const caps = capabilitiesFor(user({ subscriptionStatus: status }));
    assert.equal(caps.accessDailyBrief, true);
    assert.equal(caps.readAnalysis, true);
    assert.equal(caps.participateInThreads, true);
    assert.equal(caps.curate, false);
  }
});

test('overrides beat Stripe state in both directions', () => {
  assert.equal(user({ subscriptionStatus: 'inactive', subscriptionOverride: 'active' }).hasAccess(), true);
  assert.equal(user({ subscriptionStatus: 'active', subscriptionOverride: 'inactive' }).hasAccess(), false);
});

test('staff get everything; only admins manage members', () => {
  const editor = capabilitiesFor(user({ role: 'editor' }));
  assert.equal(editor.accessDailyBrief, true);
  assert.equal(editor.curate, true);
  assert.equal(editor.manageMembers, false);
  assert.equal(capabilitiesFor(user({ role: 'admin' })).manageMembers, true);
});

test('COMMENTS_FREE lets free accounts post', () => {
  process.env.COMMENTS_FREE = 'true';
  try {
    assert.equal(capabilitiesFor(user()).participateInThreads, true);
  } finally {
    delete process.env.COMMENTS_FREE;
  }
});

test('toPublic shape', () => {
  const json = user({ subscriptionStatus: 'past_due', subscriptionOverride: 'active' }).toPublic();
  assert.equal(json.subscriptionStatus, 'active');
  assert.equal(json.billingSubscriptionStatus, 'past_due');
  assert.equal(json.isPremium, true);
});
