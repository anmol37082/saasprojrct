import express from 'express';

import { authMiddleware } from '../middleware/authMiddleware.js';
import { rbacMiddleware } from '../middleware/rbacMiddleware.js';
import { requestContextMiddleware } from '../middleware/requestContext.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  deleteNotificationController,
  listNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
  updateNotificationPreferencesController
} from '../controllers/notificationController.js';

export function buildNotificationRouter() {
  const router = express.Router();
  router.use(requestContextMiddleware);

  router.get('/', authMiddleware({ required: true }), rbacMiddleware({}), asyncHandler(listNotificationsController));
  router.patch('/:notificationId/read', authMiddleware({ required: true }), rbacMiddleware({}), asyncHandler(markNotificationReadController));
  router.post('/read-all', authMiddleware({ required: true }), rbacMiddleware({}), asyncHandler(markAllNotificationsReadController));
  router.delete('/:notificationId', authMiddleware({ required: true }), rbacMiddleware({}), asyncHandler(deleteNotificationController));
  router.patch('/preferences', authMiddleware({ required: true }), rbacMiddleware({}), asyncHandler(updateNotificationPreferencesController));

  return router;
}
