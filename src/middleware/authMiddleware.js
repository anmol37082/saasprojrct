import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function authMiddleware({ required = true } = {}) {
  return (req, _res, next) => {
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
        scopes: payload.scopes || []
      };

      return next();
    } catch (err) {
      // Token expired vs invalid - do not leak details.
      return next(new AppError('Unauthorized', 401, 'INVALID_OR_EXPIRED_TOKEN'));
    }
  };
}

