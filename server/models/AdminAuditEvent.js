const mongoose = require('mongoose');

const adminAuditEventSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: {
      type: String,
      enum: ['user.created', 'password.reset', 'subscription.changed', 'story.curated'],
      required: true,
      index: true,
    },
    reason: { type: String, trim: true, maxlength: 500 },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminAuditEvent', adminAuditEventSchema);
