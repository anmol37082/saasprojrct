import { AppError } from '../utils/AppError.js';
import * as authService from '../services/authService.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export async function loginController(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const result = await authService.login({ email, password, req });

    return res.status(200).json(ApiResponse.ok({
      message: 'Logged in',
      data: result,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function refreshController(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) throw new AppError('Refresh token required', 400, 'MISSING_REFRESH_TOKEN');

    const result = await authService.refreshToken({ refreshToken });

    return res.status(200).json(ApiResponse.ok({
      message: 'Token refreshed',
      data: result,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function logoutController(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    await authService.logout({ refreshToken });

    return res.status(200).json(ApiResponse.ok({
      message: 'Logged out',
      data: { ok: true },
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function meController(req, res, next) {
  try {
    const adminId = req.auth?.adminId;
    if (!adminId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const admin = await authService.me({ adminId });

    return res.status(200).json(ApiResponse.ok({
      message: 'Current user',
      data: admin,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function updateProfileController(req, res, next) {
  try {
    const adminId = req.auth?.adminId;
    if (!adminId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const result = await authService.updateProfile({ adminId, payload: req.body || {} });

    return res.status(200).json(ApiResponse.ok({
      message: 'Profile updated',
      data: result,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function changePasswordController(req, res, next) {
  try {
    const adminId = req.auth?.adminId;
    if (!adminId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const { currentPassword, newPassword } = req.body || {};
    const result = await authService.changePassword({ adminId, currentPassword, newPassword });

    return res.status(200).json(ApiResponse.ok({
      message: 'Password changed',
      data: result,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function sessionsController(req, res, next) {
  try {
    const adminId = req.auth?.adminId;
    if (!adminId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const result = await authService.listSessions({ adminId });

    return res.status(200).json(ApiResponse.ok({
      message: 'Sessions retrieved',
      data: { items: result },
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function logoutAllDevicesController(req, res, next) {
  try {
    const adminId = req.auth?.adminId;
    if (!adminId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const result = await authService.logoutAllDevices({ adminId });

    return res.status(200).json(ApiResponse.ok({
      message: 'Logged out from all devices',
      data: result,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

