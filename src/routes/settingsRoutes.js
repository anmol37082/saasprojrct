import express from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { rbacMiddleware } from '../middleware/rbacMiddleware.js';
import { requestContextMiddleware } from '../middleware/requestContext.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getSettingsController, saveSettingsController } from '../controllers/settingsController.js';

export function buildSettingsRouter() {
  const router = express.Router();
  router.use(requestContextMiddleware);

  router.get('/', authMiddleware({ required: true }), rbacMiddleware({ permissions: ['settings:read'] }), asyncHandler(getSettingsController));
  router.put('/', authMiddleware({ required: true }), rbacMiddleware({ permissions: ['settings:write'] }), asyncHandler(saveSettingsController));

  return router;
}
