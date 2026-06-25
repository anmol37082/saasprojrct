import { AppError } from '../utils/AppError.js';
import { AuditLog } from '../models/AuditLog.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Tenant-scoped idempotency for public ingestion endpoints.
// NOTE: No new model is created in this Phase 7.1 code; instead, idempotency is enforced via AuditLog metadata.
// This is a foundation approach. Phase 7.2 should introduce a dedicated IdempotencyKey collection with TTL.

function sha256(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function idempotency({ ttlMs = 1000 * 60 * 10, resource = 'lead_ingest' } = {}) {
  return async (req, _res, next) => {
    try {
      const key = req.headers?.['idempotency-key'] || req.headers?.['Idempotency-Key'];
      if (!key || typeof key !== 'string') return next();
      const tenantId = req.tenantId;
      if (!tenantId) throw new AppError('Unauthorized', 401, 'MISSING_TENANT_CONTEXT');

      const requestContext = req.requestContext || {};
      const requestId = requestContext.requestId || null;

      const computedKey = sha256(`${tenantId}:${resource}:${key}`);

      const windowAgo = new Date(Date.now() - ttlMs);

      // Look for prior processing record.
      const existing = await AuditLog.findOne({
        tenantId,
        action: 'Idempotency Hit',
        'metadata.idempotencyHash': computedKey,
        createdAt: { $gte: windowAgo }
      }).lean();

      if (existing) {
        // Returning 200/409 is policy; we’ll return 409 conflict.
        return res.status(409).json({
          success: false,
          message: 'Duplicate request',
          code: 'DUPLICATE_IDEMPOTENCY',
          requestId
        });
      }

      // Store a reservation record to prevent race duplicates.
      await AuditLog.create({
        tenantId,
        actor: null,
        action: 'Idempotency Set',
        resource: resource,
        resourceId: computedKey,
        metadata: { idempotencyHash: computedKey },
        severity: 'info'
      });

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

