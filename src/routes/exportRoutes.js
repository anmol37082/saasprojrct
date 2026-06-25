import express from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { tenantGuard } from '../middleware/tenantGuard.js';
import { rbacMiddleware } from '../middleware/rbacMiddleware.js';
import { requestContextMiddleware } from '../middleware/requestContext.js';

import { exportCsvController, exportXlsxController } from '../controllers/exportController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function buildExportRouter() {
  const router = express.Router();
  router.use(requestContextMiddleware);

  router.get(
    '/csv',
    authMiddleware({ required: true }),
    tenantGuard(),
    rbacMiddleware({ permissions: ['exports:view', 'exports:download'] }),
    asyncHandler(exportCsvController)
  );

  router.get(
    '/xlsx',
    authMiddleware({ required: true }),
    tenantGuard(),
    rbacMiddleware({ permissions: ['exports:view', 'exports:download'] }),
    asyncHandler(exportXlsxController)
  );

  return router;
}

