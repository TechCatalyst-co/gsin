const express = require('express');
const stripe = require('../utils/stripe');
const User = require('../models/User');

const router = express.Router();

// NOTE: this route is mounted in server.js with express.raw() so the raw
// request body is available for signature verification. Do NOT add express.json here.
router.post('/', async (req, res) => {
  const sig = req.header('stripe-signature');
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw Buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata && session.metadata.userId;
        if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          await applySubscription(userId, session.customer, sub);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object;
        const user = await User.findOne({ stripeCustomerId: sub.customer });
        if (user) await applySubscription(user._id, sub.customer, sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const user = await User.findOne({ stripeCustomerId: sub.customer });
        if (user) {
          user.subscriptionStatus = 'canceled';
          user.stripeSubscriptionId = undefined;
          await user.save();
        }
        break;
      }
      default:
        // ignore other events
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function applySubscription(userId, customerId, sub) {
  const update = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    subscriptionStatus: sub.status, // active | trialing | past_due | canceled | unpaid
    currentPeriodEnd: sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : undefined,
  };
  await User.findByIdAndUpdate(userId, update);

  // A real, paying subscription supersedes an administrative *active* comp so
  // Stripe stays the source of truth. An 'inactive' override is a deliberate
  // denial and is left untouched.
  if (['active', 'trialing'].includes(sub.status)) {
    await User.updateOne(
      { _id: userId, subscriptionOverride: 'active' },
      {
        $set: { subscriptionOverride: 'none' },
        $unset: {
          subscriptionOverrideReason: '',
          subscriptionOverrideAt: '',
          subscriptionOverrideBy: '',
        },
      }
    );
  }
}

module.exports = router;
