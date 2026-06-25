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
  createdAt?: string;
  updatedAt?: string;
  promotedFields?: Record<string, unknown>;
  dynamicData?: Record<string, unknown>;
  [key: string]: unknown;
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

