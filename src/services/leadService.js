import { Lead } from '../models/Lead.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

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

  try {
    const lead = await Lead.create({
      tenantId,
      leadExternalId: requestContext?.requestId || randomUUID(),
      status: 'new',
      dynamicData: sanitized,
      promotedFields: promotedFields || {},
      schemaVersion: 1,
      ipAddress: requestContext?.ipAddress || '',
      userAgent: requestContext?.userAgent || '',
      referer: requestContext?.referer || '',
      metadata: {
        requestId: requestContext?.requestId || null,
        clientId: requestContext?.clientId || null,
        sourceDomain: sourceDomain || null
      }
    });

    return { accepted: true, leadId: lead._id.toString() };
  } catch (error) {
    logger.error({
      message: 'Lead create failed',
      tenantId: tenantId ? String(tenantId) : null,
      sourceDomain,
      requestId: requestContext?.requestId || null,
      clientId: requestContext?.clientId || null,
      payloadKeys: leadPayload && typeof leadPayload === 'object' ? Object.keys(leadPayload) : [],
      error: error instanceof Error ? error.message : String(error),
      errorCode: error?.code ?? null,
      keyPattern: error?.keyPattern ?? null,
      keyValue: error?.keyValue ?? null,
      duplicateKey: error?.errmsg ?? error?.message ?? null,
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error?.name === 'ValidationError') {
      throw new AppError('Invalid lead payload', 400, 'LEAD_VALIDATION_ERROR');
    }

    if (error?.code === 11000) {
      throw new AppError('Lead conflict', 409, 'LEAD_CONFLICT');
    }

    throw error;
  }
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
    severity: 'warning'
  });
}

export async function sanitizePayloadAndPromote({ tenantId, sourceDomain, payload }) {
  const promotedFields = extractPromotedFields(payload);
  const sanitizedPayload = sanitizePayloadForStorage(payload);

  return { sanitizedPayload, promotedFields };
}

export async function createLeadWithAuditing({ tenantId, sourceDomain, leadPayload, requestContext }) {
  const promotedFields = extractPromotedFields(leadPayload);

  const result = await createLead({
    tenantId,
    sourceDomain,
    leadPayload,
    requestContext,
    promotedFields
  });

  try {
    await logLeadAccepted({
      tenantId,
      actor: null,
      leadId: result.leadId,
      sourceDomain,
      metadata: {
        requestId: requestContext?.requestId || null
      }
    });
  } catch (error) {
    // Lead creation should remain successful even if audit logging is unavailable.
    logger.warn({
      message: 'Lead accepted audit log failed',
      tenantId: tenantId ? String(tenantId) : null,
      leadId: result.leadId,
      sourceDomain,
      requestId: requestContext?.requestId || null,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return { success: true, leadId: result.leadId, requestId: requestContext?.requestId || null };
}

