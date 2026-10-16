// Single source for the outlet's name on the server (RSS titles, emails).
// Rename the outlet by changing BRAND_NAME / BRAND_TAGLINE in the environment.
const BRAND = {
  name: process.env.BRAND_NAME || 'Global Super Intelligence News',
  short: process.env.BRAND_SHORT || 'GSIN',
  tagline: process.env.BRAND_TAGLINE || 'News on artificial intelligence and the road to superintelligence, from around the world.',
};

module.exports = { BRAND };
