import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import * as settingsService from '../services/settingsService.js';

export async function getSettingsController(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId ?? null;
    const data = await settingsService.getSettings({ tenantId });
    return res.status(200).json(ApiResponse.ok({
      message: 'Settings retrieved',
      data,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

export async function saveSettingsController(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId ?? null;
    const data = await settingsService.saveSettings({ tenantId, payload: req.body || {} });
    return res.status(200).json(ApiResponse.ok({
      message: 'Settings saved',
      data,
      requestId: req.requestContext?.requestId
    }));
  } catch (err) {
    return next(err);
  }
}

