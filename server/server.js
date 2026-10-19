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
    // Briefs moved from one-per-day to one-per-day-and-type: make sure the old
    // unique index on briefingDate alone is gone and the new pair index exists.
    try { await require('./models/DailyBrief').syncIndexes(); } catch (err) { console.error('index sync:', err.message); }
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
})();
