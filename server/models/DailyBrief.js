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
    kind: { type: String },
    urgent: { type: Boolean, default: false },
    impact: { type: String, trim: true },
    tier1: { type: Boolean, default: false },
    brand: { type: Boolean, default: false },
    // Global SI grading snapshot (optional).
    urgencyTier: { type: Number },
    signalScore: { type: Number },
    primarySource: { type: Boolean },
    domain: { type: String },
    direction: { type: String },
    storyKey: { type: String },
    industryLine: { type: String },
  },
  { _id: false }
);

// The evening analyst's structured sections (Global SI Evening Daily Brief).
const criticalSchema = new mongoose.Schema(
  { headline: String, whyItMatters: String, priority: String, domain: String, category: String, url: String },
  { _id: false }
);
const trendSchema = new mongoose.Schema({ trend: String, evidence: String, domain: String }, { _id: false });
const watchSchema = new mongoose.Schema({ item: String, window: String, why: String }, { _id: false });
const followupSchema = new mongoose.Schema({ predicted: String, status: String, evidence: String }, { _id: false });

const dailyBriefSchema = new mongoose.Schema(
  {
    // Normalized to UTC midnight of the brief's calendar day. One brief per day
    // AND type (morning | evening): n8n upserts on the pair.
    briefingDate: { type: Date, required: true, index: true },
    // 'morning' (6:50 AM PT consolidation) or 'evening' (5:25 PM PT analyst brief).
    // Legacy payloads without a type are stored as 'morning'.
    briefType: { type: String, enum: ['morning', 'evening'], default: 'morning', index: true },
    // Labels for the content provenance rule: which sections are AI analysis.
    contentLabels: { type: mongoose.Schema.Types.Mixed },
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
    threatCount: { type: Number, default: 0 },
    upcomingCount: { type: Number, default: 0 },
    items: { type: [briefItemSchema], default: [] },

    // Global SI fields (both types).
    plainSummary: { type: String, trim: true },
    watchToday: { type: String, trim: true },
    horizonNote: { type: String, trim: true },
    generatedAt: { type: Date },
    rubricVersion: { type: String, trim: true },
    byDomain: { type: mongoose.Schema.Types.Mixed },

    // Evening analyst sections.
    criticalIntelligence: { type: [criticalSchema], default: [] },
    emergingTrends: { type: [trendSchema], default: [] },
    crossDomainInsights: { type: [String], default: [] },
    forwardWatchlist: { type: [watchSchema], default: [] },
    watchlistFollowup: { type: [followupSchema], default: [] },
    confidence: { type: Number, min: 0, max: 100 },
    qaNote: { type: String, trim: true },
    // When the "brief is out" push went (utils/push.js). Set once per edition.
    alertedAt: { type: Date },
  },
  { timestamps: true }
);

// One brief per day and type. Backs GET /latest and the archive (newest first).
dailyBriefSchema.index({ briefingDate: -1, briefType: 1 }, { unique: true });

module.exports = mongoose.model('DailyBrief', dailyBriefSchema);
