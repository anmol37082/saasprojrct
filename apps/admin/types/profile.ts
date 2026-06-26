export type Profile = {
  id: string;
  email: string;
  role?: string;
  tenantId?: string | null;
  displayName?: string;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
  sessionVersion?: number;
  createdAt?: string;
  lastLogin?: string | null;
  notificationPreferences?: Record<string, unknown>;
  emailPreferences?: Record<string, unknown>;
  pushPreferences?: Record<string, unknown>;
};

export type ProfileUpdateInput = {
  displayName?: string;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type SessionRecord = {
  id: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  lastSeenAt?: string | null;
  revokedAt?: string | null;
  createdAt?: string;
};

