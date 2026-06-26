import { WorkspaceSetting } from '../models/WorkspaceSetting.js';

function defaultSettings() {
  return {
    general: {
      companyName: 'SaaS Admin',
      timezone: 'Asia/Calcutta',
      language: 'en'
    },
    company: {
      legalName: '',
      website: '',
      supportEmail: ''
    },
    brand: {
      primaryColor: '#22d3ee',
      logoUrl: '',
      faviconUrl: ''
    },
    theme: {
      mode: 'dark',
      density: 'comfortable'
    },
    integrations: {
      apiBaseUrl: '',
      webhookUrl: ''
    },
    security: {
      sessionTimeoutMinutes: 60,
      passwordMinLength: 12
    },
    audit: {
      retentionDays: 90
    },
    backup: {
      enabled: true,
      frequency: 'daily'
    },
    webhook: {
      enabled: false,
      endpoint: ''
    },
    smtp: {
      host: '',
      port: 587,
      username: '',
      fromEmail: ''
    },
    email: {
      fromName: 'SaaS Admin',
      replyTo: ''
    }
  };
}

export async function getSettings({ tenantId }) {
  const settings = await WorkspaceSetting.findOne({ tenantId }).lean();
  return settings ? settings : { tenantId, ...defaultSettings() };
}

export async function saveSettings({ tenantId, payload = {} }) {
  const settings = await WorkspaceSetting.findOneAndUpdate(
    { tenantId },
    {
      $set: {
        tenantId,
        ...payload
      }
    },
    {
      new: true,
      upsert: true
    }
  ).lean();

  return settings || { tenantId, ...defaultSettings(), ...payload };
}

