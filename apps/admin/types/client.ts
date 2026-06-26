export type ClientDomain = {
  id?: string;
  domain: string;
  enabled?: boolean;
  allowSubdomains?: boolean;
};

export type ClientStatistics = {
  apiKeyCount: number;
  activeApiKeyCount: number;
  allowedDomainCount: number;
  lastApiUsage?: string | null;
  latestApiKeyEnvironment?: 'prod' | 'sandbox' | string | null;
  latestApiKeyStatus?: 'active' | 'revoked' | 'disabled' | string | null;
};

export type ClientApiKey = {
  keyHash?: string;
  label?: string;
  scopes?: string[];
  status?: 'active' | 'revoked' | 'disabled' | string;
  environment?: 'prod' | 'sandbox' | string;
  createdAt?: string;
  rotatedAt?: string | null;
  lastUsedAt?: string | null;
};

export type ClientSnippet = {
  title: string;
  language: 'html' | 'javascript' | 'tsx' | 'bash' | 'text';
  code: string;
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
  subscriptionStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  lastApiUsage?: string | null;
  statistics?: ClientStatistics;
};

export type ClientCreateInput = {
  clientName: string;
  clientId: string;
  notes?: string;
  active?: boolean;
  environment?: 'prod' | 'sandbox';
  allowedDomains?: ClientDomain[];
};

export type ClientUpdateInput = {
  clientName?: string;
  notes?: string;
  active?: boolean;
  allowedDomains?: ClientDomain[];
  subscriptionStatus?: string;
};

export type ClientMutationResult = {
  client: Client;
  apiKey?: string;
  environment?: 'prod' | 'sandbox' | string;
};

export type ClientsListResponse = {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

