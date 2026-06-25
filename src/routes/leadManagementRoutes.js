import express from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { tenantGuard } from '../middleware/tenantGuard.js';
import { rbacMiddleware } from '../middleware/rbacMiddleware.js';

import { requestContextMiddleware } from '../middleware/requestContext.js';
import { asyncHandler } from '../utils/asyncHandler.js';

import {
  listLeadsController,
  getLeadController,
  deleteLeadController,
  exportCsvController,
  exportXlsxController
} from '../controllers/leadManagementController.js';

export function buildLeadManagementRouter() {
  const router = express.Router();
  router.use(requestContextMiddleware);

  // Lead management endpoints require JWT + tenant scope.

  router.get(
    '/',
    authMiddleware({ required: true }),
    tenantGuard({ allowNullTenantId: true }),
    rbacMiddleware({ permissions: ['leads:read'] }),
    asyncHandler(listLeadsController)
  );

  router.get(
    '/:id',
    authMiddleware({ required: true }),
    tenantGuard({ allowNullTenantId: true }),
    rbacMiddleware({ permissions: ['leads:read'] }),
    asyncHandler(getLeadController)
  );

  router.delete(
    '/:id',
    authMiddleware({ required: true }),
    tenantGuard({ allowNullTenantId: true }),
    rbacMiddleware({ permissions: ['leads:delete'] }),
    asyncHandler(deleteLeadController)
  );

  router.get(
    '/export/csv',
    authMiddleware({ required: true }),
    tenantGuard({ allowNullTenantId: true }),
    rbacMiddleware({ permissions: ['leads:export'] }),
    asyncHandler(exportCsvController)
  );

  router.get(
    '/export/xlsx',
    authMiddleware({ required: true }),
    tenantGuard({ allowNullTenantId: true }),
    rbacMiddleware({ permissions: ['leads:export'] }),
    asyncHandler(exportXlsxController)
  );

  return router;
}

