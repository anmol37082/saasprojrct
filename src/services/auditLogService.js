import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildSearchQuery(search) {
  if (!search || typeof search !== 'string') return {};
  const term = search.trim();
  if (!term) return {};

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(escaped, 'i');

  return {
    $or: [
      { action: rx },
      { resource: rx },
      { resourceId: rx },
      { 'metadata.reason': rx },
      { 'metadata.message': rx },
      { 'metadata.domain': rx }
    ]
  };
}

export async function listAuditLogs({ tenantId, query = {} } = {}) {
  const safeLimit = Math.min(Math.max(toNumber(query.limit, 20), 1), 100);
  const safePage = Math.max(toNumber(query.page, 1), 1);
  const skip = (safePage - 1) * safeLimit;

  const filter = {};

  if (tenantId) filter.tenantId = tenantId;
  if (query.action) filter.action = String(query.action);
  if (query.resource) filter.resource = String(query.resource);
  if (query.severity) filter.severity = String(query.severity);

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(String(query.startDate));
    if (query.endDate) filter.createdAt.$lte = new Date(String(query.endDate));
  }

  const searchQuery = buildSearchQuery(query.search);
  const finalQuery = Object.keys(searchQuery).length ? { $and: [filter, searchQuery] } : filter;

  const [items, total] = await Promise.all([
    AuditLog.find(finalQuery).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    AuditLog.countDocuments(finalQuery)
  ]);

  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(Math.ceil(total / safeLimit), 1)
  };
}

export async function logAuditEvent({ actor = null, tenantId = null, action, resource, resourceId = '', severity = 'info', metadata = {} }) {
  if (!action || !resource) {
    throw new AppError('Audit event requires action and resource', 400, 'INVALID_AUDIT_EVENT');
  }

  return AuditLog.create({
    actor,
    tenantId,
    action,
    resource,
    resourceId: String(resourceId || ''),
    severity,
    metadata
  });
}

