import { Client } from '../models/Client.js';
import { AuditLog } from '../models/AuditLog.js';

import { generateApiKey, hashApiKey } from '../utils/apiKey.js';
import { AppError } from '../utils/AppError.js';

async function writeAudit({ actor, action, resource, resourceId, tenantId, metadata, severity = 'info' }) {
  await AuditLog.create({
    actor: actor || null,
    action,
    resource,
    resourceId: resourceId ? String(resourceId) : '',
    tenantId: tenantId || null,
    metadata: metadata || {},
    severity
  });
}

function normalizeAllowedDomains(allowedDomains) {
  if (!Array.isArray(allowedDomains)) return [];
  return allowedDomains.map((d) => ({
    domain: String(d.domain).toLowerCase(),
    allowSubdomains: !!d.allowSubdomains,
    enabled: d.enabled === undefined ? true : !!d.enabled
  }));
}

export async function createClient({ clientName, clientId, active = true, allowedDomains = [], actor }) {
  const existing = await Client.findOne({ clientId });
  if (existing) throw new AppError('Client already exists', 409, 'CLIENT_EXISTS');

  const client = await Client.create({
    clientName,
    clientId,
    active,
    allowedDomains: normalizeAllowedDomains(allowedDomains),
    metadata: {},
    notes: '',
    subscriptionStatus: 'inactive'
  });

  await writeAudit({
    actor,
    action: 'CLIENT_CREATED',
    resource: 'Client',
    resourceId: client._id.toString(),
    tenantId: client._id,
    metadata: { clientId, clientName }
  });

  return client.toObject();
}

export async function updateClient({ clientDbId, update, actor }) {
  const client = await Client.findById(clientDbId);
  if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');

  Object.assign(client, update);
  await client.save();

  await writeAudit({
    actor,
    action: 'CLIENT_UPDATED',
    resource: 'Client',
    resourceId: clientDbId,
    tenantId: client._id,
    metadata: { update }
  });

  return client.toObject();
}

export async function deleteClient({ clientDbId, actor }) {
  const client = await Client.findById(clientDbId);
  if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');

  await Client.deleteOne({ _id: clientDbId });

  await writeAudit({
    actor,
    action: 'CLIENT_DELETED',
    resource: 'Client',
    resourceId: clientDbId,
    tenantId: client._id,
    metadata: { clientId: client.clientId }
  });

  return { ok: true };
}

export async function activateClient({ clientDbId, actor }) {
  const client = await Client.findById(clientDbId);
  if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');

  client.active = true;
  await client.save();

  await writeAudit({
    actor,
    action: 'CLIENT_ACTIVATED',
    resource: 'Client',
    resourceId: clientDbId,
    tenantId: client._id,
    metadata: {}
  });

  return client.toObject();
}

export async function deactivateClient({ clientDbId, actor }) {
  const client = await Client.findById(clientDbId);
  if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');

  client.active = false;
  await client.save();

  await writeAudit({
    actor,
    action: 'CLIENT_DEACTIVATED',
    resource: 'Client',
    resourceId: clientDbId,
    tenantId: client._id,
    metadata: {}
  });

  return client.toObject();
}

export async function rotateApiKey({ clientDbId, environment = 'prod', actor }) {
  const client = await Client.findById(clientDbId);
  if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');

  const now = new Date();

  // Invalidate all active keys in the same environment immediately.
  client.apiKeys = (client.apiKeys || []).map((k) => {
    if (k.environment === environment && k.status === 'active') {
      return { ...k, status: 'revoked', rotatedAt: now };
    }
    return k;
  });

  const plainKey = generateApiKey({ byteLength: 32 });
  const keyHash = hashApiKey(plainKey);

  client.apiKeys = [
    ...(client.apiKeys || []),
    {
      keyHash,
      label: `${environment}-${now.toISOString()}`,
      scopes: ['leads:write'],
      status: 'active',
      environment,
      createdAt: now,
      rotatedAt: now,
      lastUsedAt: null
    }
  ];

  await client.save();

  await writeAudit({
    actor,
    action: 'API_KEY_ROTATED',
    resource: 'Client',
    resourceId: clientDbId,
    tenantId: client._id,
    metadata: { environment }
  });

  return { clientId: client._id.toString(), apiKey: plainKey };
}

export async function addDomain({ clientDbId, domain, allowSubdomains = false, enabled = true, actor }) {
  const client = await Client.findById(clientDbId);
  if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');

  const normalized = String(domain).toLowerCase();

  const existing = (client.allowedDomains || []).find((d) => d.domain === normalized);
  if (existing) {
    existing.allowSubdomains = !!allowSubdomains;
    existing.enabled = !!enabled;
  } else {
    client.allowedDomains = [...(client.allowedDomains || []), { domain: normalized, allowSubdomains: !!allowSubdomains, enabled: !!enabled }];
  }

  await client.save();

  await writeAudit({
    actor,
    action: 'DOMAIN_ADDED',
    resource: 'Client',
    resourceId: clientDbId,
    tenantId: client._id,
    metadata: { domain: normalized, allowSubdomains, enabled }
  });

  return client.toObject();
}

export async function removeDomain({ clientDbId, domain, actor }) {
  const client = await Client.findById(clientDbId);
  if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');

  const normalized = String(domain).toLowerCase();
  client.allowedDomains = (client.allowedDomains || []).filter((d) => d.domain !== normalized);

  await client.save();

  await writeAudit({
    actor,
    action: 'DOMAIN_REMOVED',
    resource: 'Client',
    resourceId: clientDbId,
    tenantId: client._id,
    metadata: { domain: normalized }
  });

  return client.toObject();
}

export async function getClientById({ clientDbId }) {
  const client = await Client.findById(clientDbId).lean();
  if (!client) throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
  return client;
}

export async function listClients({ page = 1, limit = 20, search = '', active } = {}) {
  const q = {};
  if (active !== undefined) q.active = !!active;
  if (search) q.clientName = { $regex: String(search), $options: 'i' };

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    Client.find(q).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Client.countDocuments(q)
  ]);

  return { items, total, page: safePage, limit: safeLimit };
}

