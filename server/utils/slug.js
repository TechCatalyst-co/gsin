const crypto = require('crypto');

// "OpenAI Ships GPT-6!" + url → "openai-ships-gpt-6-3f9a1c". The short hash of
// the url keeps slugs unique and stable across re-ingests of the same story.
function slugFor(title, url) {
  const base = String(title || 'story')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
  const hash = crypto.createHash('sha1').update(String(url)).digest('hex').slice(0, 6);
  return `${base || 'story'}-${hash}`;
}

// Only http(s) links are allowed through — blocks javascript:/data: etc.
function isSafeUrl(url) {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = { slugFor, isSafeUrl };
