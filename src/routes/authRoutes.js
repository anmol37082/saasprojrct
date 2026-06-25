import express from 'express';

import { loginController, refreshController, logoutController, meController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requestContextMiddleware } from '../middleware/requestContext.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { rbacMiddleware } from '../middleware/rbacMiddleware.js';

export function buildAuthRouter() {
  const router = express.Router();

  // Attach context early.
  router.use(requestContextMiddleware);

  router.post('/login', asyncHandler(loginController));
  router.post('/refresh', asyncHandler(refreshController));
  router.post('/logout', asyncHandler(logoutController));

  router.get('/me', authMiddleware({ required: true }), rbacMiddleware({}), asyncHandler(meController));

  return router;
}

