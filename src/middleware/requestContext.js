import { randomUUID } from 'crypto';

import { logger } from '../utils/logger.js';

export function requestContextMiddleware(req, res, next) {
  const requestId = (req.headers?.['x-request-id'] || randomUUID()).toString();

  // Capture basic client context.
  const ipAddress = (req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '').toString();
  const userAgent = (req.headers?.['user-agent'] || '').toString();

  // Attach for downstream usage.
  req.requestContext = {
    requestId,
    ipAddress,
    userAgent
  };

  // Standardize response correlation.
  res.setHeader('x-request-id', requestId);

  // Helpful for debugging (Phase 4; logging policy later).
  if (process.env.NODE_ENV !== 'production') {
    logger.debug({ message: 'Request context attached', requestId });
  }

  next();
}

