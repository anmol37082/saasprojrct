import { axiosInstance } from '../lib/axios';
import type { NotificationItem, NotificationPreferencesInput, NotificationsResponse } from '../types/notification';

export async function listNotifications(params?: Record<string, string | number | boolean | undefined>): Promise<NotificationsResponse> {
  const res = await axiosInstance.get('/api/notifications', { params });
  return (res.data?.data ?? res.data) as NotificationsResponse;
}

export async function markNotificationRead(notificationId: string): Promise<NotificationItem> {
  const res = await axiosInstance.patch(`/api/notifications/${encodeURIComponent(notificationId)}/read`);
  return (res.data?.data ?? res.data) as NotificationItem;
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const res = await axiosInstance.post('/api/notifications/read-all');
  return (res.data?.data ?? res.data) as { ok: boolean };
}

export async function deleteNotification(notificationId: string): Promise<{ ok: boolean }> {
  const res = await axiosInstance.delete(`/api/notifications/${encodeURIComponent(notificationId)}`);
  return (res.data?.data ?? res.data) as { ok: boolean };
}

export async function saveNotificationPreferences(payload: NotificationPreferencesInput): Promise<NotificationPreferencesInput> {
  const res = await axiosInstance.patch('/api/notifications/preferences', payload);
  return (res.data?.data ?? res.data) as NotificationPreferencesInput;
}
