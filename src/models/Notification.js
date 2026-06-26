import mongoose from 'mongoose';

const { Schema } = mongoose;

const NotificationSchema = new Schema(
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

    title: {
      type: String,
      required: true,
      trim: true
    },

    body: {
      type: String,
      default: ''
    },

    category: {
      type: String,
      default: 'system',
      index: true
    },

    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    },

    readAt: {
      type: Date,
      default: null,
      index: true
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

NotificationSchema.index({ adminId: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
