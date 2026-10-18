const mongoose = require('mongoose');

// One story in the feed. n8n owns the editorial fields (upserted by `url`);
// the platform owns curation flags (featured/hidden) and engagement counters.
const newsItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, unique: true, index: true },
    // Human-readable, unique permalink segment derived from the title.
    slug: { type: String, unique: true, sparse: true, index: true },
    source: { type: String, default: 'RSS' },
    author: { type: String, trim: true },
    published: { type: Date, required: true, index: true },
    category: { type: String, index: true },
    tags: { type: [String], default: [], index: true },
    imageUrl: { type: String },
    // Free editorial layers: one-line dek, a short summary, "why it matters".
    headline: { type: String, trim: true },
    summary: { type: String, trim: true },
    impact: { type: String, trim: true },
    // Longer-form analysis written by the n8n pipeline (optional).
    analysis: { type: String, trim: true },
    // Breaking-news flag — drives the urgent banner.
    urgent: { type: Boolean, default: false, index: true },

    // Global SI grading, written by the n8n Radar (see docs/N8N_API.md §1b).
    // The radar scores every item against a strict rubric; the clients render
    // these as the tier chip, signal meter and gauge, the verified-source seal,
    // the domain lanes and the watchlist. All optional: a plain RSS item still
    // displays.
    urgencyTier: { type: Number, min: 1, max: 4, index: true }, // 1 BREAKING · 2 SIGNAL · 3 BRIEFING · 4 LOGGED
    tierLabel: { type: String, trim: true },
    signalScore: { type: Number, min: 0, max: 100, index: true },
    relevance: { type: Number, min: 0, max: 100 },
    primarySource: { type: Boolean, default: false },
    contentType: { type: String, trim: true }, // verified_reporting | reported
    // The event type the radar assigned (Model Release, Research Paper, …).
    // `category` holds the desk (domain) so existing clients keep working.
    kind: { type: String, trim: true },
    dimensions: { type: [String], default: [] },
    direction: { type: String, trim: true }, // advance | threat | neutral
    geo: { type: String, trim: true },
    horizon: { type: String, trim: true, index: true }, // now | upcoming | background
    entities: { type: [String], default: [] },
    whoCares: { type: String, trim: true },
    industryLine: { type: String, trim: true }, // the plain-English line
    storyKey: { type: String, trim: true, index: true },
    updateType: { type: String, trim: true }, // new | escalation | echo
    whatIsNew: { type: String, trim: true },
    sourceCount: { type: Number },
    capturedAt: { type: Date, index: true },

    // Curation (set by editors in the admin panel, never by n8n).
    featured: { type: Boolean, default: false, index: true },
    hidden: { type: Boolean, default: false, index: true },
    // When the breaking-news push went out (utils/push.js). Set once.
    alertedAt: { type: Date },

    // Denormalized count maintained by the comments routes.
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

newsItemSchema.index({ category: 1, published: -1 });
newsItemSchema.index({ urgencyTier: 1, signalScore: -1, published: -1 });
newsItemSchema.index({ storyKey: 1, published: -1 });
newsItemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('NewsItem', newsItemSchema);
