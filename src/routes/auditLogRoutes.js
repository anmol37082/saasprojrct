import express from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { rbacMiddleware } from '../middleware/rbacMiddleware.js';
import { requestContextMiddleware } from '../middleware/requestContext.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listAuditLogsController } from '../controllers/auditLogController.js';

export function buildAuditLogRouter() {
  const router = express.Router();
  router.use(requestContextMiddleware);

  router.get(
    '/',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['audit:read'] }),
    asyncHandler(listAuditLogsController)
  );

  return router;
}

