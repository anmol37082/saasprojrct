import mongoose from 'mongoose';

const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true
    },

    action: {
      type: String,
      required: true,
      index: true
    },

    resource: {
      type: String,
      required: true,
      index: true
    },

    resourceId: {
      type: String,
      default: ''
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },

    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

AuditLogSchema.index({ tenantId: 1, createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

