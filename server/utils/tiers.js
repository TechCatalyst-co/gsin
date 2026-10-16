// Single paid tier: Premium. STRIPE_PRICE_ID is accepted as a legacy alias.
const TIERS = ['premium'];

function priceIdForTier(tier) {
  if (tier === 'premium') return process.env.STRIPE_PRICE_ID_PREMIUM || process.env.STRIPE_PRICE_ID;
  return undefined;
}

module.exports = { TIERS, priceIdForTier };
