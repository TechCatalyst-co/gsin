// Comment and review bodies are stored and served as plain text — clients
// must render them as text, never as HTML. Strips C0 control chars except \n.
function cleanBody(raw, max) {
  if (typeof raw !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = raw.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '').trim();
  if (!cleaned || cleaned.length > max) return null;
  return cleaned;
}

module.exports = { cleanBody };
