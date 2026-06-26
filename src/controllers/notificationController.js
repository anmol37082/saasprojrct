import { ApiResponse } from '../utils/ApiResponse.js';
import * as notificationService from '../services/notificationService.js';
import { AppError } from '../utils/AppError.js';

export async function listNotificationsController(req, res, next) {
  try {
    const adminId = req.auth?.adminId;
    if (!adminId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const data = await notificationService.listNotifications({ adminId, query: req.query || {} });
    return res.status(200).json(ApiResponse.ok({
      message: 'Notifications retrieved',
      data,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function markNotificationReadController(req, res, next) {
  try {
    const adminId = req.auth?.adminId;
    if (!adminId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const data = await notificationService.markNotificationRead({ adminId, notificationId: req.params.notificationId });
    return res.status(200).json(ApiResponse.ok({
      message: 'Notification updated',
      data,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function markAllNotificationsReadController(req, res, next) {
  try {
    const adminId = req.auth?.adminId;
    if (!adminId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const data = await notificationService.markAllNotificationsRead({ adminId });
    return res.status(200).json(ApiResponse.ok({
      message: 'All notifications marked as read',
      data,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function deleteNotificationController(req, res, next) {
  try {
    const adminId = req.auth?.adminId;
    if (!adminId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const data = await notificationService.deleteNotification({ adminId, notificationId: req.params.notificationId });
    return res.status(200).json(ApiResponse.ok({
      message: 'Notification deleted',
      data,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function updateNotificationPreferencesController(req, res, next) {
  try {
    const adminId = req.auth?.adminId;
    if (!adminId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const data = await notificationService.updatePreferences({ adminId, payload: req.body || {} });
    return res.status(200).json(ApiResponse.ok({
      message: 'Notification preferences saved',
      data,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

