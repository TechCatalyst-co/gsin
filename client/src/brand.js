// One place to rename or re-theme the outlet on the web. Mirrors mobile/lib/brand.dart.
export const BRAND = {
  name: 'Global SI News',
  short: 'GSI',
  tagline: 'Real intelligence. A clearer tomorrow.',
  description: 'A graded feed of artificial intelligence and the path to superintelligence, swept from primary sources every 30 minutes.',
  supportEmail: 'support@techcatalyst.co',
  privacyEmail: 'privacy@techcatalyst.co',
  sourceCount: 44,
};

// The legal entity behind the outlet, named in the Privacy Policy and Terms.
export const OPERATOR = {
  name: 'Sirlopu Technology Services, LLC',
  dba: 'TechCatalyst',
  website: 'https://www.techcatalyst.co',
};

// Bump when the Privacy Policy or Terms change.
export const LEGAL_UPDATED = 'October 16, 2026';

// The desks are the Global SI domains the radar grades into. n8n may send any
// category string; unknown ones get the neutral style. `hue` drives the small
// desk dot; `short` is the compact label used in chips and lanes.
export const CATEGORIES = [
  { name: 'Frontier Models & AGI', short: 'Frontier', slug: 'frontier-models-agi', hue: '#2E7DFF' },
  { name: 'Defense & National Security', short: 'Defense', slug: 'defense-national-security', hue: '#8FA3C2' },
  { name: 'Cybersecurity', short: 'Cyber', slug: 'cybersecurity', hue: '#5B9BFF' },
  { name: 'Medical & Life Sciences', short: 'Medical', slug: 'medical-life-sciences', hue: '#7FC4A4' },
  { name: 'Policy & Regulation', short: 'Policy', slug: 'policy-regulation', hue: '#C7D2E3' },
  { name: 'Private Sector & Enterprise', short: 'Private sector', slug: 'private-sector-enterprise', hue: '#9FB6FF' },
  { name: 'Compute & Chips', short: 'Compute', slug: 'compute-chips', hue: '#6B8FD6' },
  { name: 'Robotics & Autonomy', short: 'Robotics', slug: 'robotics-autonomy', hue: '#B9C7E0' },
  { name: 'AI Safety & Alignment', short: 'Safety', slug: 'ai-safety-alignment', hue: '#D4AF37' },
  { name: 'Open Source & Developer Tools', short: 'Open source', slug: 'open-source-developer-tools', hue: '#86B7FF' },
];

const NEUTRAL = '#8A90A8';

export function categoryMeta(name) {
  const known = CATEGORIES.find((c) => c.name === name);
  if (known) return known;
  const slug = String(name || 'other').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { name: name || 'Other', short: name || 'Other', slug, hue: NEUTRAL };
}

export function categoryFromSlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.name || null;
}

export const domainShort = (name) => categoryMeta(name).short;

// The grading rubric the radar enforces in code.
export const TIER_NAME = { 1: 'Breaking', 2: 'Signal', 3: 'Briefing', 4: 'Logged' };
export const TIER_MEANING = {
  1: 'The acting party itself published this within the last 24 hours. A lab shipped it, a government ruled, a court filed.',
  2: 'Announced but not shipped, a major paper, a proposal, big money, or a significant advisory.',
  3: 'Coverage of a tier 1 or 2 action, enterprise deployments, product updates.',
  4: 'Opinion, repeat coverage, or older than seven days.',
};

// Site sections (the primary navigation).
export const NAV = [
  { to: '/', label: 'News', end: true },
  { to: '/intelligence', label: 'Intel' },
  { to: '/topic/defense-national-security', label: 'Defense' },
  { to: '/research', label: 'Research' },
  { to: '/watchlist', label: 'Watchlist' },
];
