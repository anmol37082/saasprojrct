import { Lead } from '../models/Lead.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

function sha256(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

function safeJsonStringify(value) {
  // Stable stringify: ensures idempotency hash is order-independent.
  // This is a foundation approach; Phase 6/7 can refine.
  return JSON.stringify(value, Object.keys(value).sort());
}

function buildPromotedFields(dynamicData) {
  // Deterministic extraction strategy:
  // - Look for common identity/contact-ish keys (case-insensitive)
  // - Promote if the value is a primitive string/number
  // Purpose: future filtering/indexing without requiring predefined schema.

  if (!dynamicData || typeof dynamicData !== 'object') return {};

  const entries = [];
  for (const [k, v] of Object.entries(dynamicData)) {
    entries.push([k, v]);
  }

  const lowerMap = new Map(entries.map(([k, v]) => [String(k).toLowerCase(), v]));

  const candidates = {
    name: ['name', 'fullName', 'fullname', 'clientName'],
    phone: ['phone', 'phoneNumber', 'mobile', 'mobileNumber', 'contactNumber', 'parentPhone', 'guestsPhone'],
    email: ['email', 'emailAddress', 'userEmail'],
    project: ['project', 'property', 'propertyName', 'college', 'school'],
    budget: ['budget', 'price', 'amount'],
    class: ['class', 'grade', 'level'],
    bookingDate: ['bookingDate', 'date', 'visitDate'],
    guests: ['guests', 'people', 'partySize']
  };

  const promoted = {};

  for (const [target, keys] of Object.entries(candidates)) {
    for (const k of keys) {
      const v = lowerMap.get(k.toLowerCase());
      if (v === undefined || v === null) continue;
      if (typeof v === 'string' && v.trim().length === 0) continue;
      if (typeof v === 'string' || typeof v === 'number') {
        promoted[target] = typeof v === 'string' ? v.trim() : v;
        break;
      }
    }
  }

  return promoted;
}

function sanitizePayload(dynamicData) {
  // Ensure the payload is a JSON-serializable plain object.
  // Since leadValidator already enforces JSON object, we only normalize:
  // - Strip undefined
  // - Coerce non-finite numbers
  // - Limit object keys remain (already validated)

  const normalize = (value) => {
    if (value === undefined) return null;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return null;
      return value;
    }
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = normalize(v);
      }
      return out;
    }
    if (typeof value === 'boolean') return value;
    if (value === null) return null;
    // Fallback: convert other types to string representation
    return String(value);
  };

  return normalize(dynamicData);
}

function computeDuplicateKey({ tenantId, sourceDomain, dynamicData, promotedFields }) {
  // Duplicate strategy (foundation):
  // - Prefer promotedFields.phone/email/name when available
  // - Otherwise hash the full sanitized payload with tenantId+sourceDomain

  const preferred = {
    phone: promotedFields.phone || null,
    email: promotedFields.email || null,
    name: promotedFields.name || null,
    bookingDate: promotedFields.bookingDate || null,
    project: promotedFields.project || null
  };

  const hasPreferred = Object.values(preferred).some((v) => v !== null && v !== '');

  const base = hasPreferred
    ? { tenantId, sourceDomain, preferred }
    : { tenantId, sourceDomain, payload: dynamicData };

  return sha256(safeJsonStringify(base));
}

async function detectDuplicateLead({ tenantId, duplicateKey, timeWindowMs = 1000 * 60 * 60 * 24 * 7 }) {
  const since = new Date(Date.now() - timeWindowMs);

  // Use leadExternalId-like unique key? We don’t have a dedicated field.
  // Foundation approach: store duplicateKey in leadExternalId if you want.
  // For now, we search on leadExternalId if present.
  const existing = await Lead.findOne({
    tenantId,
    leadExternalId: duplicateKey,
    createdAt: { $gte: since }
  }).lean();

  return !!existing;
}

async function writeAudit({ tenantId, actor, action, resource, resourceId, metadata, severity = 'info' }) {
  await AuditLog.create({
    tenantId: tenantId || null,
    actor: actor || null,
    action,
    resource,
    resourceId: resourceId ? String(resourceId) : '',
    metadata: metadata || {},
    severity
  });
}

export function sanitizePayloadForStorage(dynamicData) {
  return sanitizePayload(dynamicData);
}

export function extractPromotedFields(dynamicData) {
  return buildPromotedFields(dynamicData);
}

export async function createLead({ tenantId, sourceDomain, leadPayload, requestContext, promotedFields }) {
  const sanitized = sanitizePayloadForStorage(leadPayload);

  const duplicateKey = computeDuplicateKey({
    tenantId,
    sourceDomain,
    dynamicData: sanitized,
    promotedFields
  });

  const isDuplicate = await detectDuplicateLead({
    tenantId,
    duplicateKey
  });

  if (isDuplicate) {
    return { accepted: false, duplicate: true, duplicateKey };
  }

  // leadExternalId used as idempotency/dedup anchor.
  const lead = await Lead.create({
    tenantId,
    clientId: requestContext?.clientId || null,
    leadExternalId: duplicateKey,
    status: 'new',
    sourceDomain: sourceDomain || '',
    dynamicData: sanitized,
    promotedFields: promotedFields || {},
    schemaVersion: 1,
    ipAddress: requestContext?.ipAddress || '',
    userAgent: requestContext?.userAgent || '',
    referer: requestContext?.referer || '',
    metadata: {
      requestId: requestContext?.requestId || null
    }
  });

  return { accepted: true, leadId: lead._id.toString(), duplicateKey };
}

export async function detectDuplicateLeadByKey({ tenantId, duplicateKey }) {
  const existing = await Lead.findOne({ tenantId, leadExternalId: duplicateKey }).lean();
  return !!existing;
}

export async function logLeadAccepted({ tenantId, actor, leadId, sourceDomain, metadata }) {
  await writeAudit({
    tenantId,
    actor,
    action: 'Lead Accepted',
    resource: 'Lead',
    resourceId: leadId,
    metadata: { sourceDomain, ...metadata },
    severity: 'info'
  });
}

export async function logLeadRejected({ tenantId, actor, reason, metadata }) {
  await writeAudit({
    tenantId,
    actor,
    action: 'Lead Rejected',
    resource: 'Lead',
    resourceId: '',
    metadata: { reason, ...metadata },
    severity: 'warn'
  });
}

export async function sanitizePayloadAndPromote({ tenantId, sourceDomain, payload }) {
  const promotedFields = extractPromotedFields(payload);
  const sanitizedPayload = sanitizePayloadForStorage(payload);

  return { sanitizedPayload, promotedFields };
}

export async function createLeadWithAuditing({ tenantId, sourceDomain, leadPayload, requestContext }) {
  const promotedFields = extractPromotedFields(leadPayload);

  // Duplicate detection happens inside createLead.
  const result = await createLead({
    tenantId,
    sourceDomain,
    leadPayload,
    requestContext,
    promotedFields
  });

  if (!result.accepted) {
    await logLeadRejected({
      tenantId,
      actor: null,
      reason: result.duplicate ? 'Duplicate Lead' : 'Rejected',
      metadata: {
        duplicateKey: result.duplicateKey,
        sourceDomain,
        requestId: requestContext?.requestId || null
      }
    });

    return { success: false, errorCode: 'DUPLICATE_LEAD', duplicate: true, requestId: requestContext?.requestId || null };
  }

  await logLeadAccepted({
    tenantId,
    actor: null,
    leadId: result.leadId,
    sourceDomain,
    metadata: {
      requestId: requestContext?.requestId || null
    }
  });

  return { success: true, leadId: result.leadId, requestId: requestContext?.requestId || null };
}

