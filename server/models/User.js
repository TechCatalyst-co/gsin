const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// GSIN is free to read for everyone. An account (also free) is needed to
// post in discussions, save stories, follow topics, and get the brief email.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },

    // `editor` can curate the feed (feature/hide/flag breaking) and moderate
    // discussions; `admin` additionally manages members.
    role: { type: String, enum: ['member', 'editor', 'admin'], default: 'member' },

    // Reader preferences
    followedCategories: [{ type: String, trim: true }],
    // Opt-in for the Daily Brief email that n8n sends (GET /api/subscribers).
    briefEmails: { type: Boolean, default: true },
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NewsItem' }],

    // Community state. `blockedUsers` hides those authors' comments from this
    // user (App Store guideline 1.2). `banned` blocks posting only.
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    banned: { type: Boolean, default: false },

    // Temporary passwords force a change before normal API use. Bumping
    // authVersion invalidates every previously issued JWT for the user.
    mustChangePassword: { type: Boolean, default: false },
    authVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

userSchema.virtual('password').set(function (plain) {
  this._plainPassword = plain;
});

// Hash on 'validate', NOT 'save', so passwordHash exists before `required` runs.
userSchema.pre('validate', async function () {
  if (this._plainPassword) {
    this.passwordHash = await bcrypt.hash(this._plainPassword, 12);
    this._plainPassword = undefined;
  }
});

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.isStaff = function () {
  return ['editor', 'admin'].includes(this.role);
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    followedCategories: this.followedCategories || [],
    briefEmails: this.briefEmails !== false,
    bookmarkCount: (this.bookmarks || []).length,
    mustChangePassword: !!this.mustChangePassword,
  };
};

module.exports = mongoose.model('User', userSchema);
