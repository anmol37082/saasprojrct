export type AuthUser = {
  id: string;
  email: string;
  tenantId?: string | null;
  role?: string;
  displayName?: string;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
};

