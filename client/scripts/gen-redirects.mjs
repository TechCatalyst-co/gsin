// Generates client/dist/_redirects at build time.
//
// The web app makes same-origin relative calls to `/api/...`; Netlify proxies
// those to the backend. Instead of hardcoding the backend URL in netlify.toml,
// we emit the proxy rule from the API_PROXY_TARGET env var so prod and staging
// differ by ONE Netlify environment variable and share the same git config:
//   - prod site:    API_PROXY_TARGET unset  -> defaults to the prod API
//   - staging site: API_PROXY_TARGET set    -> points at the staging API
//
// Must run AFTER `vite build`: Vite empties dist/ at the start of the build, so
// writing this file earlier (or into public/) would be wiped or committed.
//
// Netlify processes _redirects BEFORE netlify.toml, so this is the single
// source of truth for routing (netlify.toml keeps only [build]).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const PROD_API = 'https://singularity-wire-api.onrender.com';
const target = (process.env.API_PROXY_TARGET || PROD_API).replace(/\/+$/, '');

const __dirname = dirname(fileURLToPath(import.meta.url));
const outFile = resolve(__dirname, '..', 'dist', '_redirects');

// `200!` on /api/* = same-origin proxy rewrite (force). A 301/302 would send the
// browser off-origin and drop the first-party HttpOnly auth cookie. The SPA
// fallback uses a plain 200 (no force) so real static assets still serve and only
// unmatched routes fall through to index.html. /api/* must come first (first
// match wins).
const contents = `# GENERATED at build time by scripts/gen-redirects.mjs — do not edit.
# Proxy target comes from env API_PROXY_TARGET (default: production API).
/api/*   ${target}/api/:splat   200!
/rss.xml   ${target}/api/v1/public/rss   200!
/sitemap.xml   ${target}/api/v1/public/sitemap.xml   200!
/*       /index.html            200
`;

writeFileSync(outFile, contents);
console.log(`[gen-redirects] wrote dist/_redirects  (/api/* -> ${target})`);
