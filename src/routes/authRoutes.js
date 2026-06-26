import express from 'express';

import {
  loginController,
  refreshController,
  logoutController,
  meController,
  updateProfileController,
  changePasswordController,
  sessionsController,
  logoutAllDevicesController
} from '../controllers/authController.js';
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
  router.patch('/profile', authMiddleware({ required: true }), rbacMiddleware({}), asyncHandler(updateProfileController));
  router.patch('/password', authMiddleware({ required: true }), rbacMiddleware({}), asyncHandler(changePasswordController));
  router.get('/sessions', authMiddleware({ required: true }), rbacMiddleware({}), asyncHandler(sessionsController));
  router.post('/logout-all', authMiddleware({ required: true }), rbacMiddleware({}), asyncHandler(logoutAllDevicesController));

  return router;
}

