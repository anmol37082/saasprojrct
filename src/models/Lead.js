import mongoose from 'mongoose';

const { Schema } = mongoose;

// Dynamic lead storage:
// - dynamicData stores ANY JSON structure
// - also keep schemaVersion to interpret future changes
// - to support filtering/search performance, we add an optional promotedFields object
//   (only populated for fields configured as filterable in Phase 3).

const LeadSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },

    clientId: {
      type: String,
      default: null,
      index: true
    },

    // Optional stable external id for idempotency.
    leadExternalId: {
      type: String,
      default: undefined,
      index: true
    },

    status: {
      type: String,
      default: 'new',
      index: true
    },

    sourceDomain: {
      type: String,
      required: false,
      index: true
    },

    // Enrichment / ingestion metadata
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    referer: { type: String, default: '' },

    // Dynamic fields (no predefined fields)
    dynamicData: {
      type: Schema.Types.Mixed,
      required: true
    },

    // Versioned interpretation of dynamicData.
    schemaVersion: {
      type: Number,
      default: 1
    },

    // Optional promoted fields for indexed searching/filtering.
    // Example: { email: 'x@y.com', phone: '...', project: 'Green City' }
    // IMPORTANT: We keep promotedFields as Mixed for Phase 3 configuration flexibility.
    // In Phase 3 (or later), we will also create specific indexes for known filterable keys.
    promotedFields: {
      type: Schema.Types.Mixed,
      default: {}
    },


    // Attribution / tracking (optional)
    attribution: {
      type: Schema.Types.Mixed,
      default: {}
    },

    // Audit metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// PERFORMANCE / QUERY OPTIMIZATION INDEXES
// 1) Tenant-local sorting by createdAt.
LeadSchema.index({ tenantId: 1, createdAt: -1 });

// 2) Tenant + status lists.
LeadSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

// 3) Optional sourceDomain filtering.
LeadSchema.index({ tenantId: 1, sourceDomain: 1, createdAt: -1 });

// 4) Optional idempotency lookup when leadExternalId is provided explicitly.
LeadSchema.index({ tenantId: 1, leadExternalId: 1 }, { unique: true, sparse: true });

// 5) If promotedFields includes common searchable keys (configured later),
// create indexes in Phase 3 using precise field paths.
// e.g. LeadSchema.index({ tenantId: 1, 'promotedFields.email': 1 });

export const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

