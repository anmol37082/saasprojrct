import { Lead } from '../models/Lead.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';

function toNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function buildSearchRegex(term) {
  if (!term || typeof term !== 'string') return null;
  const t = term.trim();
  if (!t) return null;
  // Basic regex escaping
  const escaped = t.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
}

function buildPromotedSearchQuery(searchRegex) {
  // Search within promotedFields (dynamic object)
  // Using $expr with regex against stringified fields is expensive; keep it as foundation by OR-ing common promoted keys.
  // Phase 7.1 baseline: search in promotedFields.* top-level keys via a few known keys.
  if (!searchRegex) return {};
  return {
    $or: [
      { 'promotedFields.name': searchRegex },
      { 'promotedFields.phone': searchRegex },
      { 'promotedFields.email': searchRegex },
      { 'promotedFields.project': searchRegex },
      { 'promotedFields.class': searchRegex },
      { 'promotedFields.bookingDate': searchRegex },
      { 'promotedFields.guests': searchRegex },
      { 'promotedFields.budget': searchRegex }
    ]
  };
}

function buildDynamicDataSearchQuery(searchRegex) {
  // Searching arbitrary dynamicData keys in Mongo is not feasible without indexes.
  // Baseline approach: attempt to match common likely fields.
  if (!searchRegex) return {};
  return {
    $or: [
      { 'dynamicData.name': searchRegex },
      { 'dynamicData.fullName': searchRegex },
      { 'dynamicData.phone': searchRegex },
      { 'dynamicData.email': searchRegex },
      { 'dynamicData.project': searchRegex },
      { 'dynamicData.class': searchRegex },
      { 'dynamicData.bookingDate': searchRegex },
      { 'dynamicData.guests': searchRegex }
    ]
  };
}

function normalizeFilters(query, tenantId) {
  const q = {};
  if (tenantId) q.tenantId = tenantId;

  if (query.status) q.status = String(query.status);
  if (query.sourceDomain) q.sourceDomain = String(query.sourceDomain).toLowerCase();

  if (query.startDate || query.endDate) {
    const createdAt = {};
    if (query.startDate) createdAt.$gte = new Date(String(query.startDate));
    if (query.endDate) createdAt.$lte = new Date(String(query.endDate));
    q.createdAt = createdAt;
  }

  return q;
}

async function audit({ tenantId, actor, action, resource, resourceId, metadata }) {
  await AuditLog.create({ tenantId, actor: actor || null, action, resource, resourceId: resourceId || '', metadata: metadata || {}, severity: 'info' });
}

async function safeAudit(details) {
  try {
    await audit(details);
  } catch (error) {
    // Admin actions should still succeed if audit persistence is temporarily unavailable.
    // We intentionally swallow the error here and keep the business operation non-blocking.
    console.warn('Audit write failed for lead management action', {
      action: details?.action,
      resource: details?.resource,
      resourceId: details?.resourceId,
      tenantId: details?.tenantId ? String(details.tenantId) : null,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function listLeads({ tenantId, query, sort, page, limit }) {
  const filters = normalizeFilters(query, tenantId);

  const searchRegex = buildSearchRegex(query.search);

  const searchQuery = searchRegex
    ? {
        $and: [
          filters,
          {
            $or: [
              buildDynamicDataSearchQuery(searchRegex),
              buildPromotedSearchQuery(searchRegex)
            ]
          }
        ]
      }
    : filters;

  const safeLimit = Math.min(Math.max(toNumber(limit, 20), 1), 200);
  const safePage = Math.max(toNumber(page, 1), 1);
  const skip = (safePage - 1) * safeLimit;

  const total = await Lead.countDocuments(searchQuery);

  const sortField = sort?.field || 'createdAt';
  const sortOrder = sort?.order === 'asc' ? 1 : -1;

  const items = await Lead.find(searchQuery)
    .sort({ [sortField]: sortOrder })
    .skip(skip)
    .limit(safeLimit)
    .lean();

  const totalPages = Math.ceil(total / safeLimit) || 1;

  return { items, total, totalPages, currentPage: safePage, pageSize: safeLimit };
}

export async function getLead({ tenantId, id }) {
  const lead = tenantId ? await Lead.findOne({ _id: id, tenantId }).lean() : await Lead.findById(id).lean();
  if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');
  return lead;
}

export async function deleteLead({ tenantId, id, actor }) {
  const lead = tenantId ? await Lead.findOne({ _id: id, tenantId }) : await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');

  // Soft delete
  lead.status = 'deleted';
  await lead.save();

  await safeAudit({ tenantId, actor, action: 'Lead Deleted', resource: 'Lead', resourceId: id, metadata: {} });

  return { ok: true };
}

export async function updateLead({ tenantId, id, update = {}, actor }) {
  const lead = tenantId ? await Lead.findOne({ _id: id, tenantId }) : await Lead.findById(id);
  if (!lead) throw new AppError('Lead not found', 404, 'LEAD_NOT_FOUND');

  if (update.status !== undefined) {
    lead.status = String(update.status).trim();
  }

  await lead.save();

  await safeAudit({
    tenantId,
    actor,
    action: 'Lead Updated',
    resource: 'Lead',
    resourceId: id,
    metadata: { update }
  });

  return lead.toObject();
}

export async function logLeadViewed({ tenantId, actor, leadId }) {
  await safeAudit({ tenantId, actor, action: 'Lead Viewed', resource: 'Lead', resourceId: leadId, metadata: {} });
}

export async function getLeadsForExportQuery({ tenantId, query }) {
  const filters = normalizeFilters(query, tenantId);
  if (query.status) filters.status = String(query.status);
  return filters;
}

