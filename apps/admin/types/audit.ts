export type AuditLog = {
  _id: string;
  actor?: string | null;
  action: string;
  resource: string;
  resourceId?: string;
  tenantId?: string | null;
  metadata?: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'critical' | string;
  createdAt?: string;
};

export type AuditLogsResponse = {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

