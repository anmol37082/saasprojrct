import { Lead } from '../models/Lead.js';
import { AuditLog } from '../models/AuditLog.js';
import { Client } from '../models/Client.js';

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildSearchRegex(search) {
  const term = String(search || '').trim();
  if (!term) return null;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
}

function buildDateBounds({ startDate, endDate } = {}) {
  const bounds = {};
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (start) {
    start.setHours(0, 0, 0, 0);
    bounds.$gte = start;
  }
  if (end) {
    end.setHours(23, 59, 59, 999);
    bounds.$lte = end;
  }
  return bounds;
}

function buildLeadFilter({ tenantId, search, startDate, endDate }) {
  const filter = {};
  if (tenantId) filter.tenantId = tenantId;
  const dateBounds = buildDateBounds({ startDate, endDate });
  if (Object.keys(dateBounds).length) filter.createdAt = dateBounds;

  const searchRx = buildSearchRegex(search);
  if (searchRx) {
    filter.$or = [
      { sourceDomain: searchRx },
      { status: searchRx },
      { leadExternalId: searchRx },
      { 'promotedFields.email': searchRx },
      { 'promotedFields.name': searchRx },
      { 'dynamicData.email': searchRx },
      { 'dynamicData.name': searchRx }
    ];
  }

  return filter;
}

function buildClientFilter({ tenantId, search }) {
  const filter = {};
  if (tenantId) filter._id = tenantId;
  const searchRx = buildSearchRegex(search);
  if (searchRx) {
    filter.$or = [
      { clientName: searchRx },
      { clientId: searchRx },
      { notes: searchRx }
    ];
  }
  return filter;
}

function toPercent(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

async function buildSeries({ tenantId, days }) {
  const end = startOfDay();
  const start = addDays(end, -(days - 1));
  const filter = tenantId ? { tenantId } : {};
  const grouped = await Lead.aggregate([
    { $match: { ...filter, createdAt: { $gte: start, $lte: addDays(end, 1) } } },
    {
      $group: {
        _id: {
          day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 },
        won: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.day': 1 } }
  ]);

  const dailyMap = new Map(grouped.map((item) => [item._id.day, item]));
  return Array.from({ length: days }, (_, idx) => {
    const date = addDays(start, idx);
    const key = date.toISOString().slice(0, 10);
    const value = dailyMap.get(key);
    return {
      date: key,
      count: value?.count ?? 0,
      won: value?.won ?? 0
    };
  });
}

export async function getDashboardSummary({ tenantId, query = {} }) {
  const todayStart = startOfDay();
  const weekStart = addDays(todayStart, -6);
  const monthStart = addDays(todayStart, -29);
  const leadFilter = buildLeadFilter({ tenantId, search: query.search, startDate: query.startDate, endDate: query.endDate });
  const tenantFilter = tenantId ? { tenantId } : {};
  const auditFilter = tenantId ? { tenantId } : {};
  const clientFilter = buildClientFilter({ tenantId, search: query.search });

  const [totalClients, activeClients, inactiveClients, leadTotals, leadsBySource, recentActivity, recentClients, recentLeads, weeklyLeads, monthlyLeads] =
    await Promise.all([
      Client.countDocuments(clientFilter),
      Client.countDocuments({ ...clientFilter, active: true }),
      Client.countDocuments({ ...clientFilter, active: false }),
      Promise.all([
        Lead.countDocuments(leadFilter),
        Lead.countDocuments({ ...tenantFilter, createdAt: { $gte: todayStart } }),
        Lead.countDocuments({ ...tenantFilter, createdAt: { $gte: weekStart } }),
        Lead.countDocuments({ ...tenantFilter, createdAt: { $gte: monthStart } }),
        Lead.countDocuments({ ...tenantFilter, status: 'won' })
      ]),
      Lead.aggregate([
        { $match: leadFilter },
        {
          $group: {
            _id: { $ifNull: ['$sourceDomain', 'unknown'] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),
      AuditLog.find(auditFilter).sort({ createdAt: -1 }).limit(8).lean(),
      Client.find(clientFilter).sort({ createdAt: -1 }).limit(5).lean(),
      Lead.find(leadFilter).sort({ createdAt: -1 }).limit(5).lean(),
      buildSeries({ tenantId, days: 7 }),
      buildSeries({ tenantId, days: 30 })
    ]);

  const [totalLeads, todaysLeads, weeklyLeadsTotal, monthlyLeadsTotal, wonLeads] = leadTotals;
  const conversionRate = toPercent(wonLeads, totalLeads);
  const dailyMap = new Map(weeklyLeads.map((item) => [item.date, item.count]));
  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    const date = addDays(weekStart, idx);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      count: dailyMap.get(key) || 0
    };
  });

  return {
    totalClients,
    activeClients,
    inactiveClients,
    totalLeads,
    todaysLeads,
    weeklyLeads: weeklyLeadsTotal,
    monthlyLeads: monthlyLeadsTotal,
    conversionRate,
    topSources: leadsBySource.map((item) => ({
      sourceDomain: item._id,
      count: item.count,
      share: toPercent(item.count, totalLeads)
    })),
    recentActivity,
    recentClients,
    recentLeads,
    lineChart: last7Days,
    barChart: weeklyLeads,
    pieChart: leadsBySource.map((item) => ({
      label: item._id,
      value: item.count
    })),
    areaChart: monthlyLeads
  };
}
