const express = require('express');
const mongoose = require('mongoose');
const NewsItem = require('../models/NewsItem');
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

// GET /api/public/sitemap.xml — story permalinks for search engines.
router.get('/sitemap.xml', publicLimiter, async (_req, res) => {
  try {
    const items = await NewsItem.find({ hidden: { $ne: true } })
      .sort({ published: -1 }).limit(5000).select('slug updatedAt').lean();
    const base = siteUrl();
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${xml(base)}/</loc><changefreq>hourly</changefreq></url>
${items.filter((i) => i.slug).map((i) => `<url><loc>${xml(`${base}/story/${i.slug}`)}</loc><lastmod>${new Date(i.updatedAt).toISOString()}</lastmod></url>`).join('\n')}
</urlset>`;
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(body);
  } catch (err) {
    console.error('sitemap error:', err);
    res.status(500).send('Failed to build sitemap');
  }
});

module.exports = router;
