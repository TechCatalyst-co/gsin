const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[stripe] STRIPE_SECRET_KEY is not set — billing routes will fail until configured.');
}

// apiVersion pinned so behavior doesn't shift under you when Stripe updates.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-03-31.basil',
});

module.exports = stripe;
