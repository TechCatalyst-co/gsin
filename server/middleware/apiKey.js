// Shared-secret auth for machine-to-machine calls (n8n ingest + subscriber sync).
// n8n sends header:  x-api-key: <API_KEY>
module.exports = function apiKey(req, res, next) {
  if (!process.env.API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: API_KEY not set' });
  }
  const provided = req.header('x-api-key');
  if (!provided || provided !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
};
