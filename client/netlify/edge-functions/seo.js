// Pre-renders the <head> and a readable copy of the page into the SPA shell.
//
// The web app is a client-rendered React SPA: without this, every URL returns the same empty
// index.html. Search engines that skip or defer JavaScript, link unfurlers (Slack, X, iMessage)
// and AI crawlers (GPTBot, ClaudeBot, PerplexityBot…) would see one generic title and no story.
// Here we fetch the story / brief / feed from the API and write into the first response:
//   - <title>, description, canonical, robots, Open Graph and Twitter tags
//   - schema.org JSON-LD (NewsArticle, Report, CollectionPage, BreadcrumbList)
//   - plain semantic HTML of the content inside #root, which React replaces on mount
// If the API is slow or down we fall back to the untouched shell, so this never blocks a reader.
import { BRAND, CATEGORIES, categoryMeta, TIER_NAME } from '../../src/brand.js';
import { STATIC_PAGES, topicPage, briefPage } from '../../src/seoRoutes.js';

const API_TIMEOUT_MS = 3500;
// Old paths the SPA would redirect on the client: answer with a real 301 instead.
const REDIRECTS = { '/welcome': '/', '/newsroom': '/news', '/brief': '/intelligence', '/daily-brief': '/intelligence', '/pricing': '/', '/premium': '/' };
const NOINDEX = /^\/(login|register|account|saved|change-password|delete-account|search|admin)(\/|$)/;

const env = (k) => {
  try { return globalThis.Netlify?.env?.get(k); } catch { return undefined; }
};
const SITE = (env('PUBLIC_SITE_URL') || 'https://globalsinews.com').replace(/\/+$/, '');
const API = (env('API_PROXY_TARGET') || 'https://gsin-api.onrender.com').replace(/\/+$/, '');
const DEFAULT_IMAGE = `${SITE}/og-image.jpg`;
const ORG_ID = `${SITE}/#org`;

// ---------- helpers ----------
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// JSON inside <script>: neutralize "</script" and HTML comment openers.
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const isHttp = (u) => { try { return ['http:', 'https:'].includes(new URL(u).protocol); } catch { return false; } };
const clip = (text, max = 160) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > 60 ? cut.slice(0, sp) : cut).replace(/[\s,.;:–—-]+$/, '')}…`;
};
const paras = (text) => String(text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  .map((p) => `<p>${esc(p)}</p>`).join('');
const iso = (d) => { const t = new Date(d); return Number.isNaN(t.getTime()) ? undefined : t.toISOString(); };
const day = (d) => { const t = new Date(d); return Number.isNaN(t.getTime()) ? '' : t.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); };
const storyHref = (i) => `/story/${encodeURIComponent(i.slug || i._id)}`;

async function getJson(path) {
  try {
    const res = await fetch(`${API}/api/v1${path}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (res.status === 404 || res.status === 400) return { notFound: true };
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // timeout or network: serve the plain shell
  }
}

const breadcrumbs = (trail) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${path}` })),
});

const siteNav = () => `<nav aria-label="Sections"><ul>
<li><a href="/news">Latest AI news</a></li><li><a href="/intelligence">Daily Briefs</a></li><li><a href="/research">Research</a></li><li><a href="/watchlist">Watchlist</a></li><li><a href="/about">How it works</a></li>
${CATEGORIES.map((c) => `<li><a href="/topic/${c.slug}">${esc(c.name)}</a></li>`).join('')}
</ul></nav>`;

const storyList = (items = []) => `<ol>${items.map((i) => `<li><article><h3><a href="${storyHref(i)}">${esc(i.title)}</a></h3>
<p>${esc(i.source || '')}${i.published ? ` · <time datetime="${iso(i.published)}">${day(i.published)}</time>` : ''}${i.category ? ` · ${esc(i.category)}` : ''}${i.urgencyTier ? ` · ${esc(TIER_NAME[i.urgencyTier] || '')}` : ''}</p>
${i.impact || i.summary ? `<p>${esc(clip(i.impact || i.summary, 300))}</p>` : ''}</article></li>`).join('')}</ol>`;

const itemListLd = (items = []) => ({
  '@type': 'ItemList',
  itemListElement: items.slice(0, 30).map((i, n) => ({ '@type': 'ListItem', position: n + 1, url: `${SITE}${storyHref(i)}`, name: i.title })),
});

// ---------- page builders ----------
async function feedPage(path, meta, query) {
  const data = await getJson(`/news?${query}`);
  const items = data?.items || [];
  const url = `${SITE}${path}`;
  return {
    ...meta,
    url,
    ld: [{
      '@type': 'CollectionPage', '@id': url, url, name: meta.title, description: meta.description,
      isPartOf: { '@id': `${SITE}/#website` }, publisher: { '@id': ORG_ID }, inLanguage: 'en-US',
      ...(items.length ? { mainEntity: itemListLd(items) } : {}),
    }, ...(path === '/' ? [] : [breadcrumbs([['Home', '/'], [meta.heading, path]])])],
    body: `<header><h1>${esc(meta.heading)}</h1><p>${esc(meta.description)}</p></header>
${items.length ? `<section><h2>Latest stories</h2>${storyList(items)}</section>` : ''}`,
  };
}

async function storyPage(slug) {
  const data = await getJson(`/news/${encodeURIComponent(slug)}`);
  if (!data) return null;
  if (data.notFound || !data.item) return { status: 404 };
  const i = data.item;
  const related = data.related || [];
  const path = storyHref(i);
  const url = `${SITE}${path}`;
  const cat = i.category ? categoryMeta(i.category) : null;
  const description = clip(i.impact || i.summary || i.headline || i.title);
  const image = isHttp(i.imageUrl) ? i.imageUrl : DEFAULT_IMAGE;
  const tier = i.urgencyTier ? TIER_NAME[i.urgencyTier] : null;
  const keywords = [...new Set([i.category, i.kind, ...(i.tags || []), ...(i.entities || [])].filter(Boolean))];

  const article = {
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: clip(i.title, 110),
    ...(i.headline && i.headline !== i.title ? { alternativeHeadline: i.headline } : {}),
    description,
    ...(i.summary || i.impact ? { abstract: i.impact || i.summary } : {}),
    image: [image],
    datePublished: iso(i.published),
    dateModified: iso(i.updatedAt || i.published),
    author: i.author ? [{ '@type': 'Person', name: i.author }] : [{ '@type': 'Organization', name: BRAND.name, url: SITE }],
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': `${SITE}/#website` },
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    ...(cat ? { articleSection: cat.name } : {}),
    ...(keywords.length ? { keywords: keywords.join(', ') } : {}),
    ...(i.entities?.length ? { about: i.entities.slice(0, 10).map((name) => ({ '@type': 'Thing', name })) } : {}),
    ...(isHttp(i.url) ? { isBasedOn: i.url, citation: { '@type': 'CreativeWork', url: i.url, ...(i.source ? { publisher: { '@type': 'Organization', name: i.source } } : {}) } } : {}),
    ...(i.commentCount ? { commentCount: i.commentCount } : {}),
  };

  const section = (h, t) => (t ? `<section><h2>${esc(h)}</h2>${paras(t)}</section>` : '');
  const body = `<article>
<header>
${cat ? `<p><a href="/topic/${cat.slug}">${esc(cat.name)}</a>${tier ? ` · ${esc(tier)}` : ''}${i.signalScore != null ? ` · Signal ${esc(i.signalScore)}/100` : ''}</p>` : ''}
<h1>${esc(i.title)}</h1>
${i.headline && i.headline !== i.title ? `<p>${esc(i.headline)}</p>` : ''}
<p>${i.author ? `${esc(i.author)}, ` : ''}${esc(i.source || '')}${i.published ? ` · <time datetime="${iso(i.published)}">${day(i.published)}</time>` : ''}</p>
</header>
${section('Why it matters', i.impact)}
${i.summary && i.summary !== i.impact ? section('Summary', i.summary) : ''}
${section('In plain English', i.industryLine)}
${section('Who this affects', i.whoCares)}
${i.updateType === 'escalation' ? section('What is new', i.whatIsNew) : ''}
${section('Analysis', i.analysis)}
${isHttp(i.url) ? `<p>Source: <a href="${esc(i.url)}" rel="noopener">${esc(i.source || 'Original source')}</a>. This summary was produced by an automated pipeline and curated by editors; check the original source for full detail.</p>` : ''}
${i.tags?.length ? `<p>Tags: ${i.tags.map((t) => `<a href="/search?tag=${encodeURIComponent(t)}">#${esc(t)}</a>`).join(' ')}</p>` : ''}
</article>
${related.length ? `<aside><h2>Related stories</h2>${storyList(related)}</aside>` : ''}`;

  const trail = [['Home', '/'], ['News', '/news']];
  if (cat && CATEGORIES.some((c) => c.slug === cat.slug)) trail.push([cat.name, `/topic/${cat.slug}`]);
  trail.push([clip(i.title, 80), path]);

  return {
    title: `${i.title} — ${BRAND.name}`,
    description,
    url,
    image,
    type: 'article',
    extraMeta: [
      ['property', 'article:published_time', iso(i.published)],
      ['property', 'article:modified_time', iso(i.updatedAt || i.published)],
      ['property', 'article:section', cat?.name],
      ...(i.tags || []).slice(0, 6).map((t) => ['property', 'article:tag', t]),
    ],
    ld: [article, breadcrumbs(trail)],
    body,
  };
}

async function briefPageHtml(date, type) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (type && !['morning', 'evening'].includes(type))) return { status: 404 };
  const data = await getJson(`/daily-brief/${date}${type ? `/${type}` : ''}`);
  if (!data) return null;
  if (data.notFound || !data.brief) return { status: 404 };
  const b = data.brief;
  const meta = briefPage(date, b.briefType || type);
  const path = `/intelligence/${date}/${b.briefType || type || 'morning'}`;
  const url = `${SITE}${path}`;
  const summary = b.plainSummary || b.summary;
  const list = (arr, fn) => (arr?.length ? `<ul>${arr.map(fn).join('')}</ul>` : '');
  const body = `<article>
<header><h1>${esc(meta.heading)}</h1>${b.windowStart && b.windowEnd ? `<p>Coverage: ${esc(b.windowStart)} to ${esc(b.windowEnd)}</p>` : ''}</header>
${summary ? `<section><h2>Summary</h2>${paras(summary)}</section>` : ''}
${b.keyPoints?.length ? `<section><h2>Key points</h2>${list(b.keyPoints, (k) => `<li>${esc(k)}</li>`)}</section>` : ''}
${b.criticalIntelligence?.length ? `<section><h2>Critical developments</h2>${list(b.criticalIntelligence, (c) => `<li><strong>${esc(c.headline)}</strong>${c.whyItMatters ? ` ${esc(c.whyItMatters)}` : ''}${isHttp(c.url) ? ` <a href="${esc(c.url)}" rel="noopener">Source</a>` : ''}</li>`)}</section>` : ''}
${b.emergingTrends?.length ? `<section><h2>Emerging trends</h2>${list(b.emergingTrends, (t) => `<li><strong>${esc(t.trend)}</strong>${t.evidence ? ` ${esc(t.evidence)}` : ''}</li>`)}</section>` : ''}
${b.crossDomainInsights?.length ? `<section><h2>Cross-domain insights</h2>${list(b.crossDomainInsights, (x) => `<li>${esc(x)}</li>`)}</section>` : ''}
${b.forwardWatchlist?.length ? `<section><h2>Watchlist</h2>${list(b.forwardWatchlist, (w) => `<li><strong>${esc(w.item)}</strong>${w.window ? ` (${esc(w.window)})` : ''}${w.why ? ` ${esc(w.why)}` : ''}</li>`)}</section>` : ''}
${b.items?.length ? `<section><h2>Stories in this brief</h2>${list(b.items, (it) => `<li><strong>${esc(it.title)}</strong>${it.source ? ` (${esc(it.source)})` : ''}${it.impact ? ` ${esc(it.impact)}` : ''}${isHttp(it.url) ? ` <a href="${esc(it.url)}" rel="noopener">Source</a>` : ''}</li>`)}</section>` : ''}
${b.watchToday ? `<section><h2>What to watch</h2>${paras(b.watchToday)}</section>` : ''}
</article>`;
  return {
    title: meta.title,
    description: clip(summary || meta.description),
    url,
    type: 'article',
    ld: [{
      '@type': 'Report',
      '@id': `${url}#brief`,
      url,
      name: meta.heading,
      headline: meta.heading,
      description: clip(summary || meta.description, 300),
      datePublished: iso(b.generatedAt || b.createdAt || b.briefingDate),
      dateModified: iso(b.updatedAt || b.briefingDate),
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      image: [DEFAULT_IMAGE],
      inLanguage: 'en-US',
      isAccessibleForFree: true,
      isPartOf: { '@id': `${SITE}/#website` },
    }, breadcrumbs([['Home', '/'], ['Daily Briefs', '/intelligence'], [meta.heading, path]])],
    body,
  };
}

async function staticOnly(path) {
  const meta = STATIC_PAGES[path];
  return {
    ...meta,
    url: `${SITE}${path}`,
    ld: [{ '@type': 'WebPage', '@id': `${SITE}${path}`, url: `${SITE}${path}`, name: meta.title, description: meta.description, isPartOf: { '@id': `${SITE}/#website` }, publisher: { '@id': ORG_ID } },
      breadcrumbs([['Home', '/'], [meta.heading, path]])],
    body: `<header><h1>${esc(meta.heading)}</h1><p>${esc(meta.description)}</p></header>`,
  };
}

async function route(path) {
  let m;
  if (path === '/') return feedPage('/', STATIC_PAGES['/'], 'sort=signal&hours=72&limit=30');
  if (path === '/news') return feedPage('/news', STATIC_PAGES['/news'], 'limit=40');
  if (path === '/research') return feedPage('/research', STATIC_PAGES['/research'], ['Frontier Models & AGI', 'AI Safety & Alignment', 'Medical & Life Sciences', 'Open Source & Developer Tools'].map((d) => `domain=${encodeURIComponent(d)}`).join('&') + '&limit=30');
  if (path === '/watchlist') return feedPage('/watchlist', STATIC_PAGES['/watchlist'], 'horizon=upcoming&limit=30');
  if ((m = path.match(/^\/topic\/([a-z0-9-]+)$/))) {
    const t = topicPage(m[1]);
    if (!t) return null; // unknown desk: client decides, keep shell
    return feedPage(path, t, `category=${encodeURIComponent(t.name)}&limit=30`);
  }
  if ((m = path.match(/^\/story\/([^/]+)$/))) return storyPage(decodeURIComponent(m[1]));
  if ((m = path.match(/^\/intelligence\/([^/]+)(?:\/([^/]+))?$/))) return briefPageHtml(m[1], m[2]);
  if (path === '/intelligence') {
    const data = await getJson('/daily-brief/list?limit=14');
    const meta = STATIC_PAGES['/intelligence'];
    const briefs = data?.briefs || [];
    return {
      ...meta,
      url: `${SITE}/intelligence`,
      ld: [{ '@type': 'CollectionPage', '@id': `${SITE}/intelligence`, url: `${SITE}/intelligence`, name: meta.title, description: meta.description, isPartOf: { '@id': `${SITE}/#website` }, publisher: { '@id': ORG_ID } },
        breadcrumbs([['Home', '/'], ['Daily Briefs', '/intelligence']])],
      body: `<header><h1>${esc(meta.heading)}</h1><p>${esc(meta.description)}</p></header>
${briefs.length ? `<section><h2>Recent briefs</h2><ul>${briefs.map((b) => `<li><a href="/intelligence/${b.dateSlug}/${b.briefType || 'morning'}">${esc(briefPage(b.dateSlug, b.briefType).heading)}</a>${b.plainSummary || b.summary ? `: ${esc(clip(b.plainSummary || b.summary, 220))}` : ''}</li>`).join('')}</ul></section>` : ''}`,
    };
  }
  if (STATIC_PAGES[path]) return staticOnly(path);
  if (/^\/topic\/[^/]+$/.test(path)) return null; // desk the client knows by ?name=
  return { status: 404 };
}

function renderHead(page, noindex) {
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(clip(page.description))}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}" />`,
    `<link rel="canonical" href="${esc(page.url)}" />`,
    `<meta property="og:type" content="${esc(page.type || 'website')}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(clip(page.description, 200))}" />`,
    `<meta property="og:url" content="${esc(page.url)}" />`,
    `<meta property="og:image" content="${esc(page.image || DEFAULT_IMAGE)}" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(clip(page.description, 200))}" />`,
    `<meta name="twitter:image" content="${esc(page.image || DEFAULT_IMAGE)}" />`,
    ...(page.extraMeta || []).filter(([, , v]) => v).map(([a, k, v]) => `<meta ${a}="${esc(k)}" content="${esc(v)}" />`),
  ];
  if (page.ld?.length) tags.push(jsonLd({ '@context': 'https://schema.org', '@graph': page.ld }));
  return tags.join('\n    ');
}

// Drop the shell's default per-page tags so the page's own replace them (no duplicates).
function stripDefaults(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta name="(description|robots)"[^>]*>\s*/gi, '')
    .replace(/<(meta|link)\b[^>]*\bdata-seo\b[^>]*>\s*/gi, '');
}

export default async (request, context) => {
  const url = new URL(request.url);
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : '/';
  if (REDIRECTS[path]) return Response.redirect(new URL(REDIRECTS[path] + url.search, url), 301);
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html') || request.method !== 'GET') return response;

  const previewHost = /--/.test(url.hostname) && url.hostname.endsWith('.netlify.app');
  const noindex = NOINDEX.test(path);
  let page = null;
  if (!noindex) {
    try { page = await route(path); } catch (err) { console.error('seo route error', path, err); }
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  if (previewHost) headers.set('X-Robots-Tag', 'noindex');

  let html = await response.text();
  let status = response.status;

  if (page?.status === 404) {
    status = 404;
    html = stripDefaults(html).replace('</head>', `    ${renderHead({ title: `Not found — ${BRAND.name}`, description: 'This page is no longer available.', url: `${SITE}${path}` }, true)}\n  </head>`);
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    headers.set('Netlify-CDN-Cache-Control', 'public, durable, s-maxage=60');
    return new Response(html, { status, headers });
  }

  if (noindex) {
    html = html.replace(/<meta name="robots"[^>]*>/i, '<meta name="robots" content="noindex, follow" />')
      .replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${esc(`${SITE}${path}`)}" />`);
  } else if (page) {
    html = stripDefaults(html).replace('</head>', `    ${renderHead(page, false)}\n  </head>`);
    if (page.body) {
      html = html.replace('<div id="root"></div>', `<div id="root"><div class="prerender">${page.body}\n${siteNav()}</div></div>`);
    }
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    headers.set('Netlify-CDN-Cache-Control', 'public, durable, s-maxage=300, stale-while-revalidate=86400');
  } else {
    // API unreachable: serve the shell but with a canonical for this URL, and don't let the CDN keep it.
    html = html.replace(/<link rel="canonical"[^>]*>/i, `<link rel="canonical" href="${esc(`${SITE}${path}`)}" />`)
      .replace(/<meta property="og:url"[^>]*>/i, `<meta property="og:url" content="${esc(`${SITE}${path}`)}" />`);
  }
  return new Response(html, { status, headers });
};

export const config = {
  path: '/*',
  excludedPath: [
    '/api/*', '/assets/*', '/rss.xml', '/sitemap.xml', '/news-sitemap.xml', '/llms.txt', '/llms-full.txt',
    '/robots.txt', '/site.webmanifest', '/*.png', '/*.jpg', '/*.svg', '/*.ico', '/*.js', '/*.css', '/*.woff2', '/*.txt', '/*.xml',
  ],
  cache: 'manual',
  onError: 'bypass',
};
