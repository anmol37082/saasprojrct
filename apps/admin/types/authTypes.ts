export type AuthUser = {
  id: string;
  email: string;
  tenantId?: string | null;
  role?: string;
};

