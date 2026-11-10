// Client-side head management. The Netlify edge function (netlify/edge-functions/seo.js)
// writes the same tags into the first HTML response for crawlers; this keeps them correct
// as a reader navigates inside the single-page app (and for crawlers that run JS).
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BRAND } from './brand';
import { STATIC_PAGES } from './seoRoutes';

export const SITE_URL = 'https://globalsinews.com';
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
export const DEFAULT_DESCRIPTION =
  'Free, graded news on artificial intelligence and the road to superintelligence. Frontier models, research, safety, policy, compute and more, swept from primary sources every 30 minutes and summarized with why it matters.';

// Pages that are personal, transactional or infinite (search) stay out of the index.
const NOINDEX = [/^\/(login|register|account|saved|change-password|delete-account|search)(\/|$)/, /^\/admin(\/|$)/];
export const isNoindexPath = (path) => NOINDEX.some((rx) => rx.test(path));

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function clip(text, max = 160) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > 60 ? cut.slice(0, sp) : cut).replace(/[\s,.;:–—-]+$/, '')}…`;
}

export function useSeo({ title, description, image, type = 'website', noindex = false } = {}) {
  const { pathname } = useLocation();
  useEffect(() => {
    const t = title || BRAND.name;
    const d = clip(description || DEFAULT_DESCRIPTION);
    const url = `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`;
    const img = image || DEFAULT_IMAGE;
    document.title = t;
    setMeta('name', 'description', d);
    setMeta('name', 'robots', noindex || isNoindexPath(pathname)
      ? 'noindex, follow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setCanonical(url);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:title', t);
    setMeta('property', 'og:description', d);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:title', t);
    setMeta('name', 'twitter:description', d);
    setMeta('name', 'twitter:image', img);
  }, [title, description, image, type, noindex, pathname]);
}

// Mounted once, before <Routes>: gives every route a baseline (title, canonical, robots).
// Its effect runs before the page's own useSeo, which then overrides what it knows better.
export function RouteSeo() {
  const { pathname } = useLocation();
  useSeo(STATIC_PAGES[pathname] || {});
  return null;
}
