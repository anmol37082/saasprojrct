import { ApiResponse } from '../utils/ApiResponse.js';
import { AppError } from '../utils/AppError.js';
import * as dashboardService from '../services/dashboardService.js';

export async function getDashboardSummaryController(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId ?? null;

    const data = await dashboardService.getDashboardSummary({ tenantId, query: req.query || {} });

    return res.status(200).json(
      ApiResponse.ok({
        message: 'Dashboard summary retrieved',
        data,
        requestId: req.requestContext?.requestId
      })
    );
  } catch (err) {
    return next(err);
  }
}
