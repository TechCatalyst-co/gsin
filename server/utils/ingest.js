const NewsItem = require('../models/NewsItem');
const { slugFor, isSafeUrl } = require('./slug');

const str = (v, max = 20000) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
const num = (v, min, max) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  if (Number.isNaN(n)) return undefined;
  return Math.max(min, Math.min(max, Math.round(n)));
};
const bool = (v) => (v === true || v === 'true' ? true : v === false || v === 'false' ? false : undefined);
const list = (v, max = 20) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, max);
const date = (v) => {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

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
  // Global SI radar payloads carry both `domain` (the desk, e.g. "Defense &
  // National Security") and `category` (the event type, e.g. "Model Release").
  // The desk is what readers navigate by, so it lands in `category`; the event
  // type is kept as `kind`. Plain payloads keep sending `category` as the desk.
  const domain = str(raw.domain, 80);
  const eventType = str(raw.category, 80);
  const tier = num(raw.urgency_tier ?? raw.urgencyTier, 1, 4);
  const tierLabel = str(raw.tier_label ?? raw.tierLabel, 40) || (tier ? ['', 'BREAKING', 'SIGNAL', 'BRIEFING', 'LOGGED'][tier] : undefined);
  return {
    title: str(raw.title, 500),
    url,
    source: str(raw.source, 120) || 'RSS',
    author: str(raw.author || raw.creator, 200),
    published: published && !Number.isNaN(published.getTime()) ? published : undefined,
    category: domain || eventType,
    kind: domain ? eventType : str(raw.kind, 80),
    tags: tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 12),
    imageUrl: image && isSafeUrl(image) ? image : undefined,
    headline: str(raw.headline, 1000),
    summary: str(raw.summary || raw.description || raw.contentSnippet, 5000),
    impact: str(raw.impact || raw.why_it_matters, 5000),
    analysis: str(raw.analysis, 20000),
    // T1 BREAKING is urgent by definition; an explicit flag still wins.
    urgent: raw.urgent === true || raw.urgent === 'true' || raw.breaking === true || tier === 1,

    // Global SI grading (all optional).
    urgencyTier: tier,
    tierLabel,
    signalScore: num(raw.signal_score ?? raw.signalScore, 0, 100),
    relevance: num(raw.relevance, 0, 100),
    primarySource: bool(raw.primary_source ?? raw.primarySource),
    contentType: str(raw.content_type ?? raw.contentType, 40),
    dimensions: list(raw.dimensions, 6),
    direction: str(raw.direction, 20),
    geo: str(raw.geo, 80),
    horizon: str(raw.horizon, 20),
    entities: list(raw.entities, 20),
    whoCares: str(raw.who_cares ?? raw.whoCares, 2000),
    industryLine: str(raw.industry_line ?? raw.industryLine ?? raw.consumer_line, 2000),
    storyKey: str(raw.story_key ?? raw.storyKey, 200),
    updateType: str(raw.update_type ?? raw.updateType, 20),
    whatIsNew: str(raw.what_is_new ?? raw.whatIsNew, 2000),
    sourceCount: num(raw.source_count ?? raw.sourceCount, 0, 1000),
    capturedAt: date(raw.captured_at ?? raw.capturedAt ?? raw.collected_date),
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
      if ((k === 'tags' || k === 'dimensions' || k === 'entities') && !v.length) continue;
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
