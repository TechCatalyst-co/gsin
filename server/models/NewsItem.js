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
    // Premium layer: longer-form analysis written by the n8n pipeline.
    analysis: { type: String, trim: true },
    // Breaking-news flag — drives the urgent banner.
    urgent: { type: Boolean, default: false, index: true },

    // Curation (set by editors in the admin panel, never by n8n).
    featured: { type: Boolean, default: false, index: true },
    hidden: { type: Boolean, default: false, index: true },

    // Denormalized count maintained by the comments routes.
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

newsItemSchema.index({ category: 1, published: -1 });
newsItemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('NewsItem', newsItemSchema);
