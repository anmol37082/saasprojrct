import { AppError } from '../utils/AppError.js';

// RBAC design:
// - Role: super_admin, admin, manager, viewer
// - Permissions: future-proof by mapping roles to permissions.
// - This middleware is permission-based to support growth.

const ROLE_PERMISSIONS = {
  platform_admin: ['*'],
  super_admin: ['*'],
  admin: [
    'clients:read',
    'clients:write',
    'clients:delete',
    'leads:read',
    'leads:write',
    'exports:read',
    'exports:write',
    'audit:read',
    'settings:read',
    'settings:write'
  ],
  manager: ['leads:read', 'leads:write', 'exports:read', 'exports:write', 'audit:read'],
  viewer: ['leads:read', 'exports:read', 'audit:read']
};

function roleHasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

export function rbacMiddleware({ permissions = [] } = {}) {
  return (req, _res, next) => {
    const role = req.auth?.role;
    if (!role) return next(new AppError('Forbidden', 403, 'RBAC_NO_ROLE'));

    if (!permissions.length) return next();

    const missing = permissions.filter((p) => !roleHasPermission(role, p));
    if (missing.length) {
      return next(new AppError('Forbidden', 403, 'RBAC_PERMISSION_DENIED'));
    }

    next();
  };
}

// Helper for future: permission-less checks can be added in Phase 4.5.
export { ROLE_PERMISSIONS };

