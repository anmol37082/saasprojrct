import { AppError } from '../utils/AppError.js';
import * as leadManagementService from '../services/leadManagementService.js';
import { validateUpdateLead } from '../validators/leadValidator.js';

function toSort(req) {
  const field = req.query?.sortField ? String(req.query.sortField) : 'createdAt';
  const order = req.query?.sortOrder ? String(req.query.sortOrder) : 'desc';
  return { field, order: order === 'asc' ? 'asc' : 'desc' };
}

export async function listLeadsController(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId ?? req.tenantId ?? null;

    const page = req.query?.page;
    const limit = req.query?.limit;
    const sort = toSort(req);

    const result = await leadManagementService.listLeads({
      tenantId,
      query: req.query || {},
      sort,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        pageSize: result.pageSize
      },
      requestId: req.requestContext?.requestId
    });
  } catch (err) {
    return next(err);
  }
}

export async function getLeadController(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId ?? req.tenantId ?? null;

    const leadId = req.params?.id;
    if (!leadId) throw new AppError('lead id required', 400, 'MISSING_LEAD_ID');

    const lead = await leadManagementService.getLead({ tenantId, id: leadId });
    await leadManagementService.logLeadViewed({ tenantId, actor: req.auth?.adminId || null, leadId });

    return res.status(200).json({
      success: true,
      data: lead,
      requestId: req.requestContext?.requestId
    });
  } catch (err) {
    return next(err);
  }
}

export async function deleteLeadController(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId ?? req.tenantId ?? null;

    const leadId = req.params?.id;
    if (!leadId) throw new AppError('lead id required', 400, 'MISSING_LEAD_ID');

    await leadManagementService.deleteLead({
      tenantId,
      id: leadId,
      actor: req.auth?.adminId || null
    });

    return res.status(200).json({
      success: true,
      data: { ok: true },
      requestId: req.requestContext?.requestId
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateLeadController(req, res, next) {
  try {
    const tenantId = req.auth?.tenantId ?? req.tenantId ?? null;

    const leadId = req.params?.id;
    if (!leadId) throw new AppError('lead id required', 400, 'MISSING_LEAD_ID');

    const update = validateUpdateLead(req.body || {});

    const lead = await leadManagementService.updateLead({
      tenantId,
      id: leadId,
      update,
      actor: req.auth?.adminId || null
    });

    return res.status(200).json({
      success: true,
      data: lead,
      requestId: req.requestContext?.requestId
    });
  } catch (err) {
    return next(err);
  }
}

export async function exportCsvController(_req, res, next) {
  // Phase 7.1 foundation: implement a lightweight export response that enumerates without streaming.
  // Phase 7.2 must replace with streaming + XLSX streaming.
  try {
    res.status(501).json({ success: false, message: 'CSV export not implemented in Phase 7.1 baseline', code: 'NOT_IMPLEMENTED', requestId: res?.locals?.requestId });
  } catch (err) {
    return next(err);
  }
}

export async function exportXlsxController(_req, res, next) {
  try {
    res.status(501).json({ success: false, message: 'XLSX export not implemented in Phase 7.1 baseline', code: 'NOT_IMPLEMENTED', requestId: res?.locals?.requestId });
  } catch (err) {
    return next(err);
  }
}

