import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { Admin } from '../models/Admin.js';

export function authMiddleware({ required = true } = {}) {
  return async (req, _res, next) => {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (!required) return next();
      return next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.slice('Bearer '.length).trim();

    try {
      const payload = verifyAccessToken(token);

      if (payload?.typ !== 'access') {
        return next(new AppError('Unauthorized', 401, 'INVALID_TOKEN_TYPE'));
      }

      // Attach to request for downstream authorization.
      req.auth = {
        adminId: payload.adminId,
        tenantId: payload.tenantId ?? null,
        role: payload.role,
        scopes: payload.scopes || [],
        sessionId: payload.sessionId ?? null,
        sessionVersion: Number(payload.sessionVersion ?? 0)
      };

      const admin = await Admin.findById(payload.adminId).select('active sessionVersion');
      if (!admin || !admin.active) {
        return next(new AppError('Unauthorized', 401, 'ADMIN_NOT_ACTIVE'));
      }

      if (Number(admin.sessionVersion ?? 0) !== Number(payload.sessionVersion ?? 0)) {
        return next(new AppError('Unauthorized', 401, 'SESSION_REVOKED'));
      }

      return next();
    } catch (err) {
      // Token expired vs invalid - do not leak details.
      return next(new AppError('Unauthorized', 401, 'INVALID_OR_EXPIRED_TOKEN'));
    }
  };
}

