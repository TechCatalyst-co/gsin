const mongoose = require('mongoose');

// One news item as it appears inside a daily brief. Self-contained (read-only,
// links out to the source) — deliberately NOT a reference to NewsItem, since a
// brief is an editorial snapshot for a given day and must stay stable even if
// the underlying news collection changes.
const briefItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    headline: { type: String, trim: true },
    url: { type: String, required: true },
    source: { type: String, default: 'RSS' },
    published: { type: Date },
    category: { type: String },
    urgent: { type: Boolean, default: false },
    impact: { type: String, trim: true },
    tier1: { type: Boolean, default: false },
    brand: { type: Boolean, default: false },
  },
  { _id: false }
);

const dailyBriefSchema = new mongoose.Schema(
  {
    // Normalized to UTC midnight of the brief's calendar day. One brief per day
    // (n8n upserts on this), so it is the natural unique key.
    briefingDate: { type: Date, required: true, unique: true, index: true },
    // The original human label from n8n, e.g. "August 16, 2026".
    briefingDateLabel: { type: String, trim: true },
    // ET coverage window labels, stored verbatim as they arrive.
    windowStart: { type: String, trim: true },
    windowEnd: { type: String, trim: true },
    summary: { type: String, trim: true },
    keyPoints: { type: [String], default: [] },
    statsLine: { type: String, trim: true },
    // Day-level counters straight from the n8n payload.
    total: { type: Number, default: 0 },
    urgentCount: { type: Number, default: 0 },
    positiveCount: { type: Number, default: 0 },
    tier1Count: { type: Number, default: 0 },
    brandCount: { type: Number, default: 0 },
    items: { type: [briefItemSchema], default: [] },
  },
  { timestamps: true }
);

// Backs GET /latest and the archive calendar (newest first).
dailyBriefSchema.index({ briefingDate: -1 });

module.exports = mongoose.model('DailyBrief', dailyBriefSchema);
