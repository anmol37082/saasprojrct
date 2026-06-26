export type NotificationItem = {
  _id: string;
  title: string;
  body?: string;
  category?: string;
  severity?: 'info' | 'warning' | 'critical' | string;
  readAt?: string | null;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export type NotificationsResponse = {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
};

export type NotificationPreferencesInput = {
  notificationPreferences?: Record<string, unknown>;
  emailPreferences?: Record<string, unknown>;
  pushPreferences?: Record<string, unknown>;
};
