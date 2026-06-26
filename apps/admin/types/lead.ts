export type Lead = {
  id: string;
  _id?: string;
  email?: string;
  name?: string;
  phone?: string;
  sourceDomain?: string;
  tenantId?: string;
  clientId?: string;
  status?: string;
  leadExternalId?: string | null;
  referer?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: string;
  updatedAt?: string;
  promotedFields?: Record<string, unknown>;
  dynamicData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  schemaVersion?: number;
  [key: string]: unknown;
};

export type LeadStatusOption = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost' | 'deleted' | string;

export type LeadUpdateInput = {
  status?: LeadStatusOption;
};

export type LeadStatistics = {
  total: number;
  active: number;
  deleted: number;
  sources: number;
};

export type LeadAuditEntry = {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'critical' | string;
  createdAt?: string;
};

export type CreateLeadRequest = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
};

export type LeadsListResponse = {
  items: Lead[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
};

