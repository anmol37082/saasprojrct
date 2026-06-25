import * as exportService from '../services/exportService.js';


export async function exportCsvController(req, res, next) {

  try {
    const tenantId = req.tenantId || req.auth?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Unauthorized', code: 'MISSING_TENANT_CONTEXT' });

    const filters = {
      status: req.query?.status,
      sourceDomain: req.query?.sourceDomain,
      startDate: req.query?.startDate,
      endDate: req.query?.endDate,
      search: req.query?.search
    };

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=leads-${tenantId}-csv.csv`);

    // writable is the response stream.
    await exportService.streamCsv({
      tenantId,
      filters,
      writable: res,
      actor: req.auth?.adminId || null
    });

    res.end();
  } catch (err) {
    return next(err);
  }
}

export async function exportXlsxController(req, res, next) {
  try {
    const tenantId = req.tenantId || req.auth?.tenantId;
    if (!tenantId) return res.status(401).json({ success: false, message: 'Unauthorized', code: 'MISSING_TENANT_CONTEXT' });

    const filters = {
      status: req.query?.status,
      sourceDomain: req.query?.sourceDomain,
      startDate: req.query?.startDate,
      endDate: req.query?.endDate,
      search: req.query?.search
    };

    await exportService.exportXlsx({
      tenantId,
      filters,
      actor: req.auth?.adminId || null,
      res
    });

  } catch (err) {
    return next(err);
  }
}

