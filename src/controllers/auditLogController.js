import { ApiResponse } from '../utils/ApiResponse.js';
import * as auditLogService from '../services/auditLogService.js';

export async function listAuditLogsController(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId ?? null;
    const result = await auditLogService.listAuditLogs({
      tenantId,
      query: req.query || {}
    });

    return res.status(200).json(
      ApiResponse.ok({
        message: 'Audit logs retrieved',
        data: result,
        requestId: req.requestContext?.requestId
      })
    );
  } catch (err) {
    return next(err);
  }
}

