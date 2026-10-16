const express = require('express');
const stripe = require('../utils/stripe');
const requireAuth = require('../middleware/auth');
const { TIERS, priceIdForTier } = require('../utils/tiers');
const { capabilitiesFor } = require('../utils/capabilities');

const router = express.Router();

const isDev = process.env.NODE_ENV !== 'production';

function fail(res, status, friendly, err) {
  if (err) console.error(`${friendly} ::`, err);
  const body = { error: friendly };
  if (isDev && err) {
    body.detail = err.message;
    if (err.code) body.code = err.code;
    if (err.type) body.type = err.type;
  }
  return res.status(status).json(body);
}

// Creates a fresh Stripe customer and persists its id, clearing any stale
// subscription id that belonged to a previous customer/environment.
async function createAndSaveCustomer(user) {
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: { userId: user._id.toString() },
  });
  user.stripeCustomerId = customer.id;
  user.stripeSubscriptionId = undefined;
  await user.save();
  return customer.id;
}

// Returns a valid customer id. If we have one saved, verify it still exists in
// the CURRENT Stripe environment; if it was created in another sandbox/mode (or
// was deleted), Stripe returns resource_missing -- so we transparently recreate.
async function ensureCustomer(user) {
  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (existing && !existing.deleted) return existing.id;
    } catch (err) {
      if (err.code !== 'resource_missing') throw err;
      // fall through and recreate below
    }
  }
  return createAndSaveCustomer(user);
}

// POST /api/billing/checkout
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    // Block only when a *live Stripe subscription* already exists — a fresh
    // checkout would create a duplicate billing subscription. Entitlement
    // alone (hasAccess) must NOT block: an admin-comped member (override
    // 'active', no Stripe subscription) reaching here via the Upgrade page's
    // no_subscription fallback needs to buy a real subscription.
    const hasLiveBilling =
      req.user.stripeSubscriptionId &&
      ['active', 'trialing', 'past_due'].includes(req.user.subscriptionStatus);
    if (hasLiveBilling) {
      return res.status(400).json({ error: 'You already have an active subscription' });
    }
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || key.includes('xxx') || key.includes('placeholder')) {
      return fail(res, 500, 'Stripe secret key is not configured (STRIPE_SECRET_KEY).');
    }
    const tier = req.body?.tier || 'premium';
    if (!TIERS.includes(tier)) {
      return res.status(400).json({ error: `Invalid tier "${tier}". Expected one of: ${TIERS.join(', ')}` });
    }
    const priceId = priceIdForTier(tier);
    if (!priceId || priceId.includes('xxx')) {
      return fail(res, 500, `Stripe price is not configured for the ${tier} tier (STRIPE_PRICE_ID_PREMIUM).`);
    }
    if (!priceId.startsWith('price_')) {
      return fail(res, 500, `Stripe price for the ${tier} tier should start with "price_", got "${priceId}". Use the price id, not the product id.`);
    }

    const customerId = await ensureCustomer(req.user);
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').trim();
    if (!/^https?:\/\//i.test(clientUrl)) {
      return fail(
        res,
        500,
        `CLIENT_URL is misconfigured: "${clientUrl}" must start with http:// or https://`
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${clientUrl}/account?checkout=success`,
      cancel_url: `${clientUrl}/pricing?checkout=cancelled`,
      metadata: { userId: req.user._id.toString(), tier },
    });

    res.json({ url: session.url });
  } catch (err) {
    fail(res, 500, 'Could not start checkout', err);
  }
});

// POST /api/billing/portal
router.post('/portal', requireAuth, async (req, res) => {
  try {
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account found' });
    }
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const portal = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: `${clientUrl}/account`,
    });
    res.json({ url: portal.url });
  } catch (err) {
    fail(res, 500, 'Could not open billing portal', err);
  }
});

// GET /api/billing/status
router.get('/status', requireAuth, async (req, res) => {
  try {
    res.json({
      subscriptionStatus: req.user.effectiveSubscriptionStatus(),
      billingSubscriptionStatus: req.user.subscriptionStatus,
      subscriptionOverride: req.user.subscriptionOverride || 'none',
      hasAccess: req.user.hasAccess(),
      currentPeriodEnd: req.user.currentPeriodEnd,
      isPremium: req.user.isPremium(),
      capabilities: capabilitiesFor(req.user),
    });
  } catch (err) {
    fail(res, 500, 'Could not load billing status', err);
  }
});

module.exports = router;
