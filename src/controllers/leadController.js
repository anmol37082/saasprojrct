import { AppError } from '../utils/AppError.js';
import * as leadService from '../services/leadService.js';

export async function createLeadController(req, res, next) {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) throw new AppError('Unauthorized', 401, 'MISSING_TENANT_CONTEXT');

    const sourceDomainValue = req.sourceDomain || '';

    const leadPayload = req.leadPayload;

    if (!leadPayload || typeof leadPayload !== 'object') {
      throw new AppError('Invalid payload', 400, 'INVALID_PAYLOAD');
    }

    const requestContext = {
      requestId: req.requestContext?.requestId,
      ipAddress: req.requestContext?.ipAddress || '',
      userAgent: req.requestContext?.userAgent || '',
      referer: req.requestContext?.referer || '',
      clientId: req.client?.clientId || null
    };

    const result = await leadService.createLeadWithAuditing({
      tenantId,
      sourceDomain: sourceDomainValue,
      leadPayload,
      requestContext
    });

    return res.status(201).json({
      success: result.success,
      leadId: result.leadId,
      requestId: result.requestId
    });
  } catch (err) {
    return next(err);
  }
}

