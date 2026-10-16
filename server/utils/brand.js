// Single source for the outlet's name on the server (RSS titles, emails).
// Rename the outlet by changing BRAND_NAME / BRAND_TAGLINE in the environment.
const BRAND = {
  name: process.env.BRAND_NAME || 'Singularity Wire',
  tagline: process.env.BRAND_TAGLINE || 'Daily news on artificial intelligence and the road to superintelligence.',
};

module.exports = { BRAND };
