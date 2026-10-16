const mongoose = require('mongoose');

// A user-submitted request to delete their account and associated data.
// Deletion is manual/reviewed: this row is created by the public deletion form
// and worked by an admin, who flips `status` once the account is handled.
const deletionRequestSchema = new mongoose.Schema(
  {
    // The email the requester typed. Stored even when no account matches so we
    // have an audit trail and a reply-to address.
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    // Optional free-text context from the requester.
    reason: { type: String, trim: true, maxlength: 1000 },
    // Best-effort link to an existing account, set at submit time if the email
    // matches. Null when the email has no account (we never reveal which).
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['pending', 'completed', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeletionRequest', deletionRequestSchema);
