import { AppError } from '../utils/AppError.js';

// Tenant guard strategy:
// - JWT claims contain tenantId (or null for platform super admin)
// - Any tenant-scoped repository access MUST filter by tenantId
// - This middleware can validate that a requested resource tenant matches
//   the caller's tenant.
//
// Usage pattern (Phase 3/4 integration in Phase 4.5):
// - Set req.auth.tenantId from authMiddleware.
// - For routes that accept a :tenantId or clientId, use tenantGuard to compare.

export function tenantGuard({
  // field in req.params (or req.query) to compare with caller tenantId
  tenantIdParam = 'tenantId',
  allowNullTenantId = false
} = {}) {
  return (req, _res, next) => {
    const callerTenantId = req.auth?.tenantId || null;

    if (!callerTenantId && !allowNullTenantId) {
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }

    if (callerTenantId === null && allowNullTenantId) {
      return next();
    }

    const paramValue =
      req.params?.[tenantIdParam] ??
      req.query?.[tenantIdParam] ??
      req.body?.[tenantIdParam];

    if (paramValue === undefined || paramValue === null || paramValue === '') {
      return next(new AppError('Bad Request', 400, 'MISSING_TENANT_SCOPE'));
    }

    // For platform super admin, tenantId may be null in token.
    const isPlatformAllowed = callerTenantId === null;
    if (isPlatformAllowed) return next();

    if (paramValue.toString() !== callerTenantId.toString()) {
      return next(new AppError('Forbidden', 403, 'TENANT_LEAKAGE_BLOCKED'));
    }

    return next();
  };
}

