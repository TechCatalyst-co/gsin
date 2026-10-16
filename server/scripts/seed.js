// Loads the sample stories and daily brief into the configured database, the
// same way n8n would (through the ingest helpers). Safe to re-run.
//   npm run seed
require('../config/loadEnv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const DailyBrief = require('../models/DailyBrief');
const { normalizeItem, upsertNewsItems } = require('../utils/ingest');
const news = require('../../samples/news-sample.json');
const brief = require('../../samples/daily-brief-sample.json');

(async () => {
  await connectDB();
  const result = await upsertNewsItems(news.map(normalizeItem));
  console.log(`stories: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`);

  const d = new Date(brief.briefing_date);
  const briefingDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  await DailyBrief.updateOne(
    { briefingDate },
    {
      $set: {
        briefingDate,
        briefingDateLabel: brief.briefing_date,
        windowStart: brief.window_start,
        windowEnd: brief.window_end,
        summary: brief.summary,
        keyPoints: brief.key_points,
        statsLine: brief.stats_line,
        total: brief.app_items.length,
        urgentCount: brief.urgent_count || 0,
        items: brief.app_items,
      },
    },
    { upsert: true }
  );
  console.log(`daily brief: ${brief.briefing_date}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
