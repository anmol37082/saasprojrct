import { Lead } from '../models/Lead.js';
import { AuditLog } from '../models/AuditLog.js';
import ExcelJS from 'exceljs';

function normalizeFilters({ tenantId, status, sourceDomain, startDate, endDate, search }) {
  const q = {};
  if (tenantId) q.tenantId = tenantId;

  if (status) q.status = String(status);
  if (sourceDomain) q.sourceDomain = String(sourceDomain).toLowerCase();

  if (startDate || endDate) {
    const createdAt = {};
    if (startDate) createdAt.$gte = new Date(String(startDate));
    if (endDate) createdAt.$lte = new Date(String(endDate));
    q.createdAt = createdAt;
  }

  // Search foundation: OR across dynamic/promoted fields with a limited set.
  if (search) {
    const term = String(search).trim();
    if (term) {
      const escaped = term.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
      const rx = new RegExp(escaped, 'i');

      q.$and = q.$and || [];
      q.$and.push({
        $or: [
          { 'promotedFields.name': rx },
          { 'promotedFields.phone': rx },
          { 'promotedFields.email': rx },
          { 'promotedFields.project': rx },
          { 'promotedFields.class': rx },
          { 'promotedFields.bookingDate': rx },
          { 'dynamicData.name': rx },
          { 'dynamicData.phone': rx },
          { 'dynamicData.email': rx }
        ]
      });
    }
  }

  return q;
}

function toCsvRow(values) {
  // Minimal CSV escaping
  return values
    .map((v) => {
      if (v === null || v === undefined) return '';
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      const escaped = s.replace(/"/g, '""');
      return /[\n\r,\"]/.test(escaped) ? `"${escaped}"` : escaped;
    })
    .join(',');
}

function getExportHeaders({ includeDynamic = false } = {}) {
  // CSV header list (foundation)
  const base = [
    'leadId',
    'tenantId',
    'clientId',
    'status',
    'sourceDomain',
    'createdAt',
    'updatedAt'
  ];

  const promoted = ['promotedFields.name', 'promotedFields.phone', 'promotedFields.email', 'promotedFields.project', 'promotedFields.class', 'promotedFields.bookingDate', 'promotedFields.guests', 'promotedFields.budget'];

  // For CSV memory efficiency, avoid exporting arbitrary dynamic keys in this baseline.
  // Export promoted + raw dynamicData as JSON blob.
  const dynamic = includeDynamic ? ['dynamicData'] : ['dynamicData'];

  return [...base, ...promoted, ...dynamic];
}

async function audit({ tenantId, actor, action, resourceId, metadata }) {
  try {
    await AuditLog.create({
      tenantId: tenantId || null,
      actor: actor || null,
      action,
      resource: 'Export',
      resourceId: resourceId ? String(resourceId) : '',
      metadata: metadata || {},
      severity: 'info'
    });
  } catch (error) {
    console.warn('Audit write failed for export action', {
      action,
      tenantId: tenantId ? String(tenantId) : null,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export function buildLeadExportQuery({ tenantId, filters }) {
  return normalizeFilters({ tenantId, ...filters });
}

export async function streamCsv({ tenantId, filters, writable, actor }) {
  const query = buildLeadExportQuery({ tenantId, filters });
  const headers = getExportHeaders();

  // Write header
  writable.write(`${headers.join(',')}\n`);

  // Use cursor to stream results from Mongo.
  const cursor = Lead.find(query)
    .sort({ createdAt: -1 })
    .cursor({ batchSize: 500 })
    .addCursorFlag('noCursorTimeout');

  let count = 0;

  for await (const doc of cursor) {
    const lead = doc.toObject ? doc.toObject() : doc;

    const row = [
      lead._id.toString(),
      lead.tenantId ? lead.tenantId.toString() : '',
      lead.clientId || '',
      lead.status || '',
      lead.sourceDomain || '',
      lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
      lead.updatedAt ? new Date(lead.updatedAt).toISOString() : '',

      lead.promotedFields?.name || '',
      lead.promotedFields?.phone || '',
      lead.promotedFields?.email || '',
      lead.promotedFields?.project || '',
      lead.promotedFields?.class || '',
      lead.promotedFields?.bookingDate || '',
      lead.promotedFields?.guests || '',
      lead.promotedFields?.budget || '',

      JSON.stringify(lead.dynamicData || {})
    ];

    writable.write(`${toCsvRow(row)}\n`);
    count += 1;

    // Safety: stop extremely large exports per request.
    if (count >= 200000) break;
  }

  await audit({ tenantId, actor, action: 'CSV Export', resourceId: '', metadata: { filters } });
}

function safeJson(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function exportXlsx({ tenantId, filters, actor, res }) {
  // Large dataset friendly: use streaming writer.
  // Vercel/serverless: stream to response; ExcelJS supports streaming workbook writers.
  await audit({ tenantId, actor, action: 'XLSX Export', resourceId: '', metadata: { filters } });

  const headers = [
    'Lead ID',
    'Created At',
    'Source Domain',
    'Dynamic Data',
    'Promoted Fields'
  ];

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8'
  );
  res.setHeader('Content-Disposition', `attachment; filename=leads-${tenantId}-xlsx.xlsx`);

  const options = { useStyles: false, useSharedStrings: true };

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    ...options
  });

  const sheet = workbook.addWorksheet('Leads');
  sheet.addRow(headers).commit();

  const query = buildLeadExportQuery({ tenantId, filters });

  const cursor = Lead.find(query)
    .sort({ createdAt: -1 })
    .cursor({ batchSize: 500 })
    .addCursorFlag('noCursorTimeout');

  let count = 0;
  for await (const doc of cursor) {
    const lead = doc.toObject ? doc.toObject() : doc;

    sheet.addRow([
      lead._id.toString(),
      lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
      lead.sourceDomain || '',
      safeJson(lead.dynamicData || {}),
      safeJson(lead.promotedFields || {})
    ]).commit();

    count += 1;
    if (count >= 200000) break;
  }

  await workbook.commit();
}


