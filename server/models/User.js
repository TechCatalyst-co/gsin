const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Singularity Wire has two audiences: anonymous/free readers (who can read the
// whole news feed) and Premium members (Daily Brief, deep analysis, and
// posting in discussions). Accounts are free; Premium is a Stripe subscription
// or an admin-granted override.
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

    // Stripe / subscription state
    stripeCustomerId: { type: String, index: true },
    stripeSubscriptionId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: ['inactive', 'active', 'trialing', 'past_due', 'canceled', 'unpaid'],
      default: 'inactive',
      index: true,
    },
    currentPeriodEnd: { type: Date },

    // Administrative entitlement override. Stripe remains the billing source
    // of truth; this field only controls application access (comps, press
    // passes, refunds-in-progress).
    subscriptionOverride: {
      type: String,
      enum: ['none', 'active', 'inactive'],
      default: 'none',
      index: true,
    },
    subscriptionOverrideReason: { type: String, trim: true, maxlength: 500 },
    subscriptionOverrideAt: { type: Date },
    subscriptionOverrideBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // `editor` can curate the feed (feature/hide/flag breaking) and moderate
    // discussions; `admin` additionally manages members and entitlements.
    role: { type: String, enum: ['member', 'editor', 'admin'], default: 'member' },

    // Reader preferences
    followedCategories: [{ type: String, trim: true }],
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

// Paid (or comped) Premium membership.
userSchema.methods.hasAccess = function () {
  if (this.subscriptionOverride === 'active') return true;
  if (this.subscriptionOverride === 'inactive') return false;
  return ['active', 'trialing'].includes(this.subscriptionStatus);
};

userSchema.methods.effectiveSubscriptionStatus = function () {
  if (this.subscriptionOverride === 'active') return 'active';
  if (this.subscriptionOverride === 'inactive') return 'inactive';
  return this.subscriptionStatus;
};

userSchema.methods.isStaff = function () {
  return ['editor', 'admin'].includes(this.role);
};

// Premium features are open to paying members and staff.
userSchema.methods.isPremium = function () {
  return this.isStaff() || this.hasAccess();
};

// Query equivalent of hasAccess(), for metrics and subscriber lists.
userSchema.statics.activeAccessFilter = function () {
  return {
    $or: [
      { subscriptionOverride: 'active' },
      {
        subscriptionOverride: { $nin: ['active', 'inactive'] },
        subscriptionStatus: { $in: ['active', 'trialing'] },
      },
    ],
  };
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    subscriptionStatus: this.effectiveSubscriptionStatus(),
    billingSubscriptionStatus: this.subscriptionStatus,
    subscriptionOverride: this.subscriptionOverride || 'none',
    subscriptionOverrideReason: this.subscriptionOverrideReason,
    currentPeriodEnd: this.currentPeriodEnd,
    hasAccess: this.hasAccess(),
    isPremium: this.isPremium(),
    followedCategories: this.followedCategories || [],
    bookmarkCount: (this.bookmarks || []).length,
    mustChangePassword: !!this.mustChangePassword,
  };
};

module.exports = mongoose.model('User', userSchema);
