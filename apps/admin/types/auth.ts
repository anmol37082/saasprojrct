export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

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

export type AuthResponse = {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
  admin?: AuthUser;
};

