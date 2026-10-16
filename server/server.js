require('./config/loadEnv');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

// IMPORTANT: the Stripe webhook must receive the RAW body for signature
// verification, so it is mounted BEFORE express.json() with express.raw().
// Aliased under /api/v1 too, so the versioned path stays symmetric (Stripe
// still only calls whichever URL is set in its dashboard).
app.use(
  ['/api/billing/webhook', '/api/v1/billing/webhook'],
  express.raw({ type: 'application/json' }),
  require('./routes/webhook')
);

// All other routes use JSON parsing.
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) =>
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
);

// Every JSON endpoint lives in one router, mounted at both the legacy `/api`
// prefix (kept working for already-shipped clients) and the explicit `/api/v1`.
// New client builds call `/api/v1`; a future breaking revision mounts a
// separate router at `/api/v2`.
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);
app.use('/api/v1', apiRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
})();
