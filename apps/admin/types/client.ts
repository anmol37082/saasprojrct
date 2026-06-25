export type ClientDomain = {
  id?: string;
  domain: string;
  enabled?: boolean;
  allowSubdomains?: boolean;
};

export type ClientApiKey = {
  label?: string;
  scopes?: string[];
  status?: 'active' | 'revoked' | 'disabled' | string;
  environment?: 'prod' | 'sandbox' | string;
  createdAt?: string;
  rotatedAt?: string | null;
  lastUsedAt?: string | null;
};

export type Client = {
  id: string;
  _id?: string;
  clientName?: string;
  clientId?: string;
  status?: 'active' | 'inactive' | string;
  tenantId?: string;
  apiKey?: string;
  apiKeys?: ClientApiKey[];
  allowedDomains?: ClientDomain[];
  notes?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientsListResponse = {
  items: Client[];
  total: number;
  page: number;
  limit: number;
};

