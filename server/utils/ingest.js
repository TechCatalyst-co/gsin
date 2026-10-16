const NewsItem = require('../models/NewsItem');
const { slugFor, isSafeUrl } = require('./slug');

const str = (v, max = 20000) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);

// Normalize one n8n item into the NewsItem editorial shape. Accepts a few
// common aliases so an n8n RSS/LLM node can be wired with minimal mapping:
//   link → url, pubDate/isoDate → published, image/thumbnail → imageUrl,
//   description/contentSnippet → summary, why_it_matters → impact.
function normalizeItem(raw = {}) {
  const url = raw.url || raw.link;
  const publishedRaw = raw.published || raw.pubDate || raw.isoDate || raw.published_at;
  const published = publishedRaw ? new Date(publishedRaw) : undefined;
  const image = raw.imageUrl || raw.image || raw.thumbnail;
  const tags = Array.isArray(raw.tags)
    ? raw.tags
    : typeof raw.tags === 'string'
      ? raw.tags.split(',')
      : [];
  return {
    title: str(raw.title, 500),
    url,
    source: str(raw.source, 120) || 'RSS',
    author: str(raw.author || raw.creator, 200),
    published: published && !Number.isNaN(published.getTime()) ? published : undefined,
    category: str(raw.category, 80),
    tags: tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 12),
    imageUrl: image && isSafeUrl(image) ? image : undefined,
    headline: str(raw.headline, 1000),
    summary: str(raw.summary || raw.description || raw.contentSnippet, 5000),
    impact: str(raw.impact || raw.why_it_matters, 5000),
    analysis: str(raw.analysis, 20000),
    urgent: raw.urgent === true || raw.urgent === 'true' || raw.breaking === true,
  };
}

function isValid(item) {
  return !!(item && item.title && item.url && isSafeUrl(item.url));
}

// Upsert by url. Only fields n8n actually sent are $set, so a partial update
// (e.g. flipping `urgent`) never blanks other fields, and curation flags and
// comment counts are never touched.
async function upsertNewsItems(items) {
  const ops = items.map((item) => {
    const set = {};
    for (const [k, v] of Object.entries(item)) {
      if (v === undefined || k === 'url') continue;
      if (k === 'tags' && !v.length) continue;
      set[k] = v;
    }
    const setOnInsert = { slug: slugFor(item.title, item.url) };
    if (!set.published) setOnInsert.published = new Date();
    return {
      updateOne: {
        filter: { url: item.url },
        update: { $set: set, $setOnInsert: setOnInsert },
        upsert: true,
      },
    };
  });
  if (!ops.length) return { upsertedCount: 0, modifiedCount: 0 };
  return NewsItem.bulkWrite(ops, { ordered: false });
}

module.exports = { normalizeItem, isValid, upsertNewsItems };
