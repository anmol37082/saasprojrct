import { Notification } from '../models/Notification.js';
import { Admin } from '../models/Admin.js';
import { AppError } from '../utils/AppError.js';

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildFilter({ adminId, query = {} }) {
  const filter = { adminId };
  if (query.category) filter.category = String(query.category);
  if (query.unread === 'true') filter.readAt = null;
  return filter;
}

export async function listNotifications({ adminId, query = {} }) {
  const safeLimit = Math.min(Math.max(toNumber(query.limit, 20), 1), 100);
  const safePage = Math.max(toNumber(query.page, 1), 1);
  const skip = (safePage - 1) * safeLimit;
  const filter = buildFilter({ adminId, query });

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ adminId, readAt: null })
  ]);

  return {
    items: items.map((item) => ({
      _id: item._id.toString(),
      title: item.title,
      body: item.body || '',
      category: item.category || 'system',
      severity: item.severity || 'info',
      readAt: item.readAt || null,
      createdAt: item.createdAt,
      metadata: item.metadata || {}
    })),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1),
    unreadCount
  };
}

export async function markNotificationRead({ adminId, notificationId }) {
  const item = await Notification.findOneAndUpdate(
    { _id: notificationId, adminId },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();

  if (!item) throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
  return item;
}

export async function markAllNotificationsRead({ adminId }) {
  await Notification.updateMany({ adminId, readAt: null }, { $set: { readAt: new Date() } });
  return { ok: true };
}

export async function deleteNotification({ adminId, notificationId }) {
  const result = await Notification.deleteOne({ _id: notificationId, adminId });
  if (!result.deletedCount) throw new AppError('Notification not found', 404, 'NOTIFICATION_NOT_FOUND');
  return { ok: true };
}

export async function updatePreferences({ adminId, payload = {} }) {
  const admin = await Admin.findById(adminId).select('notificationPreferences emailPreferences pushPreferences');
  if (!admin) throw new AppError('Unauthorized', 401, 'ADMIN_NOT_FOUND');

  admin.notificationPreferences = payload.notificationPreferences ?? admin.notificationPreferences ?? {};
  admin.emailPreferences = payload.emailPreferences ?? admin.emailPreferences ?? {};
  admin.pushPreferences = payload.pushPreferences ?? admin.pushPreferences ?? {};
  await admin.save();

  return {
    notificationPreferences: admin.notificationPreferences || {},
    emailPreferences: admin.emailPreferences || {},
    pushPreferences: admin.pushPreferences || {}
  };
}

