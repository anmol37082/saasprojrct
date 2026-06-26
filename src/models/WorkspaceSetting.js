import mongoose from 'mongoose';

const { Schema } = mongoose;

const WorkspaceSettingSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      unique: true,
      index: true
    },
    general: {
      type: Schema.Types.Mixed,
      default: {}
    },
    company: {
      type: Schema.Types.Mixed,
      default: {}
    },
    brand: {
      type: Schema.Types.Mixed,
      default: {}
    },
    theme: {
      type: Schema.Types.Mixed,
      default: {}
    },
    integrations: {
      type: Schema.Types.Mixed,
      default: {}
    },
    security: {
      type: Schema.Types.Mixed,
      default: {}
    },
    audit: {
      type: Schema.Types.Mixed,
      default: {}
    },
    backup: {
      type: Schema.Types.Mixed,
      default: {}
    },
    webhook: {
      type: Schema.Types.Mixed,
      default: {}
    },
    smtp: {
      type: Schema.Types.Mixed,
      default: {}
    },
    email: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export const WorkspaceSetting =
  mongoose.models.WorkspaceSetting || mongoose.model('WorkspaceSetting', WorkspaceSettingSchema);
