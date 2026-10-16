// Only allow http(s) links to be rendered as external anchors — mirrors the
// server's isSafeUrl check and blocks javascript:/data: and other schemes.
export function isSafeHttpUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

// A `returnTo` from a query string is attacker-controllable, so only accept an
// internal, relative path — a single leading slash, never "//host" or a scheme.
// Returns the path if safe, otherwise null.
export function safeInternalPath(p) {
  if (typeof p !== 'string') return null;
  if (!p.startsWith('/') || p.startsWith('//')) return null;
  if (p.includes('://') || /[\x00-\x1f]/.test(p)) return null;
  return p;
}
