import express from 'express';

import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { domainWhitelist } from '../middleware/domainWhitelist.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { tenantGuard } from '../middleware/tenantGuard.js';
import { rbacMiddleware } from '../middleware/rbacMiddleware.js';
import { requestContextMiddleware } from '../middleware/requestContext.js';

import { leadValidator } from '../validators/leadValidator.js';
import { createLeadController } from '../controllers/leadController.js';
import {
  listLeadsController,
  getLeadController,
  deleteLeadController,
  updateLeadController
} from '../controllers/leadManagementController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export function buildLeadRouter() {
  const router = express.Router();

  router.use(requestContextMiddleware);

  // Public lead ingestion
  router.post(
    '/',
    apiKeyAuth(),
    domainWhitelist(),
    leadValidator(),
    asyncHandler(createLeadController)
  );

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

  router.patch(
    '/:id',
    authMiddleware({ required: true }),
    tenantGuard({ allowNullTenantId: true }),
    rbacMiddleware({ permissions: ['leads:write'] }),
    asyncHandler(updateLeadController)
  );

  router.delete(
    '/:id',
    authMiddleware({ required: true }),
    tenantGuard({ allowNullTenantId: true }),
    rbacMiddleware({ permissions: ['leads:delete'] }),
    asyncHandler(deleteLeadController)
  );

  return router;
}

