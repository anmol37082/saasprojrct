export type SettingsShape = {
  tenantId?: string | null;
  general: {
    companyName: string;
    timezone: string;
    language: string;
  };
  company: {
    legalName: string;
    website: string;
    supportEmail: string;
  };
  brand: {
    primaryColor: string;
    logoUrl: string;
    faviconUrl: string;
  };
  theme: {
    mode: 'dark' | 'light' | 'system' | string;
    density: 'comfortable' | 'compact' | string;
  };
  integrations: {
    apiBaseUrl: string;
    webhookUrl: string;
  };
  security: {
    sessionTimeoutMinutes: number;
    passwordMinLength: number;
  };
  audit: {
    retentionDays: number;
  };
  backup: {
    enabled: boolean;
    frequency: string;
  };
  webhook: {
    enabled: boolean;
    endpoint: string;
  };
  smtp: {
    host: string;
    port: number;
    username: string;
    fromEmail: string;
  };
  email: {
    fromName: string;
    replyTo: string;
  };
};

export type SettingsUpdateInput = Partial<SettingsShape>;

