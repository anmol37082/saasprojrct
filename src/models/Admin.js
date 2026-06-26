import mongoose from 'mongoose';

const { Schema } = mongoose;

const AdminSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },

    // Multi-tenant: null means platform admin.
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true
    },

    // SECURITY: do not store plaintext password.
    // Use bcrypt/argon2 hash in Phase 3.
    passwordHash: {
      type: String,
      required: true,
      select: false
    },

    displayName: {
      type: String,
      trim: true,
      default: ''
    },

    avatarUrl: {
      type: String,
      trim: true,
      default: ''
    },

    timezone: {
      type: String,
      trim: true,
      default: 'Asia/Calcutta'
    },

    language: {
      type: String,
      trim: true,
      default: 'en'
    },

    notificationPreferences: {
      type: Schema.Types.Mixed,
      default: {}
    },

    emailPreferences: {
      type: Schema.Types.Mixed,
      default: {}
    },

    pushPreferences: {
      type: Schema.Types.Mixed,
      default: {}
    },

    sessionVersion: {
      type: Number,
      default: 0,
      index: true
    },

    role: {
      type: String,
      required: true,
      enum: ['platform_admin', 'tenant_admin', 'support_agent'],
      index: true
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    },

    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Unique index: email within tenant scope.
AdminSchema.index({ tenantId: 1, email: 1 }, { unique: true, sparse: true });

export const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

