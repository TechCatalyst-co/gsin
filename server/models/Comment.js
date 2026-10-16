const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    newsItem: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsItem', required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Snapshot at write time so threads never depend on the users collection.
    authorName: { type: String, required: true, trim: true },
    // 'staff' | 'premium' | 'member' — snapshotted badge for the author row.
    authorBadge: { type: String, enum: ['staff', 'premium', 'member'], default: 'member' },
    body: { type: String, required: true, trim: true, maxlength: 2000 },

    // Soft delete keeps thread structure intact.
    status: { type: String, enum: ['visible', 'removed'], default: 'visible' },
    removedBy: { type: String, enum: ['author', 'admin'] },

    reports: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, maxlength: 500 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ newsItem: 1, createdAt: 1 });
commentSchema.index({ reportCount: -1 });

module.exports = mongoose.model('Comment', commentSchema);
