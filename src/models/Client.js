import mongoose from 'mongoose';

const { Schema } = mongoose;

const ApiKeyHashSchema = new Schema(
  {
    keyHash: {
      type: String,
      required: true
    },


    label: {
      type: String,
      trim: true,
      default: ''
    },

    scopes: {
      type: [String],
      default: ['leads:write']
    },

    status: {
      type: String,
      enum: ['active', 'revoked', 'disabled'],
      default: 'active',
      index: true
    },

    environment: {
      type: String,
      enum: ['prod', 'sandbox'],
      default: 'prod',
      index: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    rotatedAt: {
      type: Date,
      default: null
    },

    lastUsedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const AllowedDomainSchema = new Schema(
  {
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    enabled: { type: Boolean, default: true },
    // If true, allow subdomain matching.
    allowSubdomains: { type: Boolean, default: false }
  },
  { _id: false }
);

const ClientSchema = new Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    // External identifier shown to admins/clients.
    clientId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true
    },

    active: {
      type: Boolean,
      default: true,
      index: true
    },

    notes: {
      type: String,
      default: ''
    },

    // SECURITY: never store raw API keys.
    apiKeys: {
      type: [ApiKeyHashSchema],
      default: []
    },

    allowedDomains: {
      type: [AllowedDomainSchema],
      default: []
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },

    // Future: subscription plans / billing status
    subscriptionStatus: {
      type: String,
      default: 'inactive'
    }
  },
  {
    timestamps: true
  }
);

// Index to accelerate tenant-based API key lookup.
ClientSchema.index({ 'apiKeys.keyHash': 1 }, { unique: true, sparse: true });

// Index for domain validation.
ClientSchema.index({ 'allowedDomains.domain': 1 });

export const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);

