import express from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { rbacMiddleware } from '../middleware/rbacMiddleware.js';
import { requestContextMiddleware } from '../middleware/requestContext.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDashboardSummaryController } from '../controllers/dashboardController.js';

export function buildDashboardRouter() {
  const router = express.Router();
  router.use(requestContextMiddleware);

  router.get(
    '/summary',
    authMiddleware({ required: true }),
    rbacMiddleware({ permissions: ['leads:read'] }),
    asyncHandler(getDashboardSummaryController)
  );

  return router;
}

