import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  const requestId = req?.headers?.['x-request-id'] || undefined;

  // Normalize
  const appError = err instanceof AppError ? err : new AppError('Internal Server Error', 500, 'INTERNAL_ERROR');

  const statusCode = appError.statusCode || 500;

  // Log internal details
  logger.error({
    message: appError.message,
    code: appError.code,
    statusCode,
    requestId,
    stack: appError.stack
  });

  // Never leak internals
  const payload = {
    message: appError.publicMessage,
    code: appError.code,
    requestId
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.debug = { stack: err?.stack };
  }

  return res.status(statusCode).json(payload);
}

