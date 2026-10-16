// One place to rename or re-theme the outlet on the web.
export const BRAND = {
  name: 'Global Super Intelligence News',
  short: 'GSIN',
  tagline: 'News on artificial intelligence and the road to superintelligence, from around the world.',
  premiumPrice: '$8',
  supportEmail: 'support@example.com',
};

// Known desks. n8n may send any category string; unknown ones get the neutral
// style. `hue` drives the category dot so a reader can scan desks by color.
export const CATEGORIES = [
  { name: 'Frontier Models', slug: 'frontier-models', hue: '#3B3BF5' },
  { name: 'Research', slug: 'research', hue: '#0E8F86' },
  { name: 'Safety & Alignment', slug: 'safety-alignment', hue: '#C2410C' },
  { name: 'Policy & Regulation', slug: 'policy-regulation', hue: '#7C3AED' },
  { name: 'Industry & Funding', slug: 'industry-funding', hue: '#B45309' },
  { name: 'Compute & Hardware', slug: 'compute-hardware', hue: '#475569' },
  { name: 'Open Source', slug: 'open-source', hue: '#15803D' },
  { name: 'Superintelligence', slug: 'superintelligence', hue: '#BE185D' },
  { name: 'Robotics', slug: 'robotics', hue: '#0369A1' },
];

const NEUTRAL = '#8A90A8';

export function categoryMeta(name) {
  const known = CATEGORIES.find((c) => c.name === name);
  if (known) return known;
  const slug = String(name || 'other').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { name: name || 'Other', slug, hue: NEUTRAL };
}

export function categoryFromSlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.name || null;
}
