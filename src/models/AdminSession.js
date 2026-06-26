import mongoose from 'mongoose';

const { Schema } = mongoose;

const AdminSessionSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true
    },

    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    userAgent: {
      type: String,
      default: ''
    },

    ipAddress: {
      type: String,
      default: ''
    },

    lastSeenAt: {
      type: Date,
      default: null
    },

    revokedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

AdminSessionSchema.index({ adminId: 1, revokedAt: 1, createdAt: -1 });

export const AdminSession = mongoose.models.AdminSession || mongoose.model('AdminSession', AdminSessionSchema);
