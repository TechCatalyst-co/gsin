const express = require('express');
const mongoose = require('mongoose');
const NewsItem = require('../models/NewsItem');
const DailyBrief = require('../models/DailyBrief');
const { publicLimiter } = require('../middleware/rateLimit');
const { BRAND } = require('../utils/brand');

const router = express.Router();

const EXCERPT_LEN = 200;

function excerpt(text) {
  const s = String(text || '').trim();
  if (s.length <= EXCERPT_LEN) return s;
  const cut = s.slice(0, EXCERPT_LEN);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

const xml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const siteUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// GET /api/public/news/:idOrSlug/preview — compact card for link unfurls.
router.get('/news/:idOrSlug/preview', publicLimiter, async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
    const item = await NewsItem.findOne({ ...query, hidden: { $ne: true } }).lean();
    if (!item) return res.status(404).json({ error: 'Story not found' });
    res.set('Cache-Control', 'public, max-age=300');
    res.json({
      id: String(item._id),
      slug: item.slug,
      title: item.title,
      headline: item.headline || item.title,
      excerpt: excerpt(item.summary || item.impact || item.headline),
      imageUrl: item.imageUrl || null,
      category: item.category || null,
      sourceName: item.source || 'RSS',
      published: item.published || null,
    });
  } catch (err) {
    console.error('public preview error:', err);
    res.status(500).json({ error: 'Failed to load preview' });
  }
});

// GET /api/public/rss[?category=] — RSS 2.0 feed of the latest 50 stories.
router.get('/rss', publicLimiter, async (req, res) => {
  try {
    const filter = { hidden: { $ne: true } };
    if (req.query.category) filter.category = String(req.query.category);
    const items = await NewsItem.find(filter).sort({ published: -1 }).limit(50).lean();
    const base = siteUrl();
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${xml(BRAND.name)}${req.query.category ? ` — ${xml(req.query.category)}` : ''}</title>
<link>${xml(base)}</link>
<description>${xml(BRAND.tagline)}</description>
<language>en-us</language>
${items.map((i) => `<item>
<title>${xml(i.title)}</title>
<link>${xml(`${base}/story/${i.slug || i._id}`)}</link>
<guid isPermaLink="false">${xml(String(i._id))}</guid>
<pubDate>${new Date(i.published).toUTCString()}</pubDate>
${i.category ? `<category>${xml(i.category)}</category>` : ''}
<description>${xml(i.summary || i.headline || '')}</description>
</item>`).join('\n')}
</channel>
</rss>`;
    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(body);
  } catch (err) {
    console.error('rss error:', err);
    res.status(500).send('Failed to build feed');
  }
});

// Desk slugs for topic pages. Mirrors client/src/brand.js CATEGORIES.
const TOPIC_SLUGS = [
  'frontier-models-agi', 'defense-national-security', 'cybersecurity', 'medical-life-sciences',
  'policy-regulation', 'private-sector-enterprise', 'compute-chips', 'robotics-autonomy',
  'ai-safety-alignment', 'open-source-developer-tools',
];
const STATIC_PATHS = [
  ['/', 'hourly', '1.0'], ['/news', 'always', '1.0'], ['/intelligence', 'hourly', '0.9'],
  ['/research', 'hourly', '0.8'], ['/watchlist', 'hourly', '0.7'], ['/about', 'monthly', '0.5'],
  ['/privacy', 'yearly', '0.2'], ['/terms', 'yearly', '0.2'],
];
const urlTag = (loc, { lastmod, changefreq, priority } = {}) =>
  `<url><loc>${xml(loc)}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}${changefreq ? `<changefreq>${changefreq}</changefreq>` : ''}${priority ? `<priority>${priority}</priority>` : ''}</url>`;

// GET /api/public/sitemap.xml — every indexable page: sections, desks, daily
// briefs and story permalinks.
router.get('/sitemap.xml', publicLimiter, async (_req, res) => {
  try {
    const [items, briefs] = await Promise.all([
      NewsItem.find({ hidden: { $ne: true }, slug: { $exists: true, $ne: null } })
        .sort({ published: -1 }).limit(45000).select('slug updatedAt published').lean(),
      DailyBrief.find().sort({ briefingDate: -1 }).limit(2000).select('briefingDate briefType updatedAt').lean(),
    ]);
    const base = siteUrl();
    const newest = items[0]?.updatedAt;
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_PATHS.map(([p, changefreq, priority]) => urlTag(`${base}${p}`, { changefreq, priority, lastmod: changefreq === 'hourly' || changefreq === 'always' ? newest : undefined })).join('\n')}
${TOPIC_SLUGS.map((t) => urlTag(`${base}/topic/${t}`, { changefreq: 'hourly', priority: '0.7', lastmod: newest })).join('\n')}
${briefs.map((b) => urlTag(`${base}/intelligence/${b.briefingDate.toISOString().slice(0, 10)}/${b.briefType || 'morning'}`, { lastmod: b.updatedAt, priority: '0.6' })).join('\n')}
${items.map((i) => urlTag(`${base}/story/${i.slug}`, { lastmod: i.updatedAt || i.published })).join('\n')}
</urlset>`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(body);
  } catch (err) {
    console.error('sitemap error:', err);
    res.status(500).send('Failed to build sitemap');
  }
});

// GET /api/public/news-sitemap.xml — Google News sitemap: stories from the
// last 48 hours (Google's window), at most 1000.
router.get('/news-sitemap.xml', publicLimiter, async (_req, res) => {
  try {
    const since = new Date(Date.now() - 48 * 3600 * 1000);
    const items = await NewsItem.find({ hidden: { $ne: true }, slug: { $exists: true, $ne: null }, published: { $gte: since } })
      .sort({ published: -1 }).limit(1000).select('slug title published tags category').lean();
    const base = siteUrl();
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items.map((i) => `<url><loc>${xml(`${base}/story/${i.slug}`)}</loc><news:news><news:publication><news:name>${xml(BRAND.webName)}</news:name><news:language>en</news:language></news:publication><news:publication_date>${new Date(i.published).toISOString()}</news:publication_date><news:title>${xml(i.title)}</news:title>${[i.category, ...(i.tags || [])].filter(Boolean).length ? `<news:keywords>${xml([i.category, ...(i.tags || [])].filter(Boolean).slice(0, 10).join(', '))}</news:keywords>` : ''}</news:news></url>`).join('\n')}
</urlset>`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=600');
    res.send(body);
  } catch (err) {
    console.error('news sitemap error:', err);
    res.status(500).send('Failed to build news sitemap');
  }
});

// GET /api/public/llms-full.txt — the latest stories and briefs as one Markdown
// document for language models and AI assistants (see llms.txt on the web).
const md = (s) => String(s ?? '').replace(/\r/g, '').trim();
router.get('/llms-full.txt', publicLimiter, async (_req, res) => {
  try {
    const [items, morning, evening] = await Promise.all([
      NewsItem.find({ hidden: { $ne: true } }).sort({ published: -1 }).limit(100).lean(),
      DailyBrief.findOne({ briefType: 'morning' }).sort({ briefingDate: -1 }).lean(),
      DailyBrief.findOne({ briefType: 'evening' }).sort({ briefingDate: -1 }).lean(),
    ]);
    const base = siteUrl();
    const briefMd = (b) => {
      if (!b) return '';
      const date = b.briefingDate.toISOString().slice(0, 10);
      const lines = [`## ${b.briefType === 'evening' ? 'Evening' : 'Morning'} brief, ${date}`, '', `URL: ${base}/intelligence/${date}/${b.briefType}`, ''];
      if (b.plainSummary || b.summary) lines.push(md(b.plainSummary || b.summary), '');
      if (b.keyPoints?.length) lines.push('Key points:', ...b.keyPoints.map((k) => `- ${md(k)}`), '');
      if (b.criticalIntelligence?.length) lines.push('Critical developments:', ...b.criticalIntelligence.map((c) => `- ${md(c.headline)}${c.whyItMatters ? `: ${md(c.whyItMatters)}` : ''}`), '');
      if (b.emergingTrends?.length) lines.push('Emerging trends:', ...b.emergingTrends.map((t) => `- ${md(t.trend)}${t.evidence ? `: ${md(t.evidence)}` : ''}`), '');
      if (b.forwardWatchlist?.length) lines.push('Watchlist:', ...b.forwardWatchlist.map((w) => `- ${md(w.item)}${w.window ? ` (${md(w.window)})` : ''}${w.why ? `: ${md(w.why)}` : ''}`), '');
      return lines.join('\n');
    };
    const tierName = { 1: 'Breaking', 2: 'Signal', 3: 'Briefing', 4: 'Logged' };
    const storyMd = (i) => {
      const lines = [`### ${md(i.title)}`, ''];
      const facts = [
        `Published: ${new Date(i.published).toISOString()}`,
        i.source && `Source: ${md(i.source)}${i.url ? ` (${i.url})` : ''}`,
        i.category && `Topic: ${md(i.category)}`,
        i.urgencyTier && `Tier: ${i.urgencyTier} ${tierName[i.urgencyTier] || ''}`.trim(),
        i.signalScore != null && `Signal score: ${i.signalScore}/100`,
        `Permalink: ${base}/story/${i.slug || i._id}`,
      ].filter(Boolean);
      lines.push(...facts.map((f) => `- ${f}`), '');
      if (i.headline && i.headline !== i.title) lines.push(md(i.headline), '');
      if (i.impact) lines.push(`Why it matters: ${md(i.impact)}`, '');
      if (i.summary && i.summary !== i.impact) lines.push(md(i.summary), '');
      if (i.industryLine) lines.push(`In plain English: ${md(i.industryLine)}`, '');
      if (i.analysis) lines.push(md(i.analysis), '');
      return lines.join('\n');
    };
    const body = [
      `# ${BRAND.webName} — full text`,
      '',
      `> ${BRAND.webName} (${BRAND.name}) is a free news outlet for artificial intelligence and the road to superintelligence. Stories are gathered from primary sources, graded (tier 1 Breaking to tier 4 Logged, plus a 0-100 signal score), summarized by an automated pipeline and curated by editors. Always cite the original source for facts.`,
      '',
      `Generated: ${new Date().toISOString()} · Site: ${base} · Guide: ${base}/llms.txt`,
      '',
      '# Latest daily briefs',
      '',
      briefMd(morning),
      briefMd(evening),
      `# Latest ${items.length} stories`,
      '',
      ...items.map(storyMd),
    ].join('\n');
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=600');
    res.send(body);
  } catch (err) {
    console.error('llms-full error:', err);
    res.status(500).send('Failed to build llms-full.txt');
  }
});

module.exports = router;
