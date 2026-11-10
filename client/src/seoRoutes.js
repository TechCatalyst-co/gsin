// Titles and descriptions for the fixed pages. Shared by the React pages (src/seo.js)
// and the Netlify edge function that pre-renders the <head> for crawlers.
import { BRAND, CATEGORIES } from './brand.js';

export const STATIC_PAGES = {
  '/': {
    title: `${BRAND.name}: AI and superintelligence news, graded and summarized`,
    description: 'Free, graded news on artificial intelligence and the road to superintelligence. Frontier models, research, safety, policy, compute and more, swept from primary sources every 30 minutes and summarized with why it matters.',
    heading: 'AI and superintelligence news, graded and summarized',
  },
  '/news': {
    title: `Latest AI news, graded by signal — ${BRAND.name}`,
    description: 'The live AI news wire: breaking releases, research, safety, policy, compute and industry moves, each graded by tier and signal score and summarized with why it matters.',
    heading: 'Latest AI news',
  },
  '/intelligence': {
    title: `AI Daily Briefs, morning and evening — ${BRAND.name}`,
    description: 'Two AI briefs a day: a morning consolidation of the last 24 hours and an evening analyst brief with critical developments, trends, a watchlist and graded forecasts.',
    heading: 'AI Daily Briefs',
  },
  '/research': {
    title: `AI research news: frontier models, safety, open source — ${BRAND.name}`,
    description: 'Frontier model releases, capability thresholds, AI safety and alignment work, medical AI and open-source releases, with the papers behind the claims.',
    heading: 'AI research',
  },
  '/watchlist': {
    title: `AI watchlist: what is coming next — ${BRAND.name}`,
    description: 'Upcoming AI model releases, rulings, deadlines and announced-but-unshipped developments the radar is tracking.',
    heading: 'Watchlist',
  },
  '/about': {
    title: `How it works: sources, grading and tiers — ${BRAND.name}`,
    description: 'How the radar sweeps primary sources, grades every AI story into Breaking, Signal, Briefing and Logged tiers, scores its signal, and how editors curate the result.',
    heading: 'How it works',
  },
  '/terms': { title: `Terms of Service — ${BRAND.name}`, description: `The terms for using ${BRAND.name} on the web and in the app.`, heading: 'Terms of Service' },
  '/privacy': { title: `Privacy Policy — ${BRAND.name}`, description: `How ${BRAND.name} collects, uses and protects reader data.`, heading: 'Privacy Policy' },
};

export function topicPage(slug) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  if (!cat) return null;
  return {
    name: cat.name,
    title: `${cat.name} news — ${BRAND.name}`,
    description: `The latest ${cat.name} news in artificial intelligence, graded by signal and summarized with why it matters. Free, updated every 30 minutes.`,
    heading: `${cat.name}`,
  };
}

export function briefPage(date, type) {
  const label = type === 'evening' ? 'Evening' : type === 'morning' ? 'Morning' : 'Daily';
  const human = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return {
    title: `${label} AI Brief, ${human} — ${BRAND.name}`,
    description: `The ${label.toLowerCase()} AI brief for ${human}: the developments in artificial intelligence that mattered, condensed and graded.`,
    heading: `${label} AI Brief — ${human}`,
  };
}
