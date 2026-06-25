import { Lead } from '../models/Lead.js';
import { AuditLog } from '../models/AuditLog.js';

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

export async function getDashboardSummary({ tenantId }) {
  const todayStart = startOfDay();
  const weekStart = addDays(todayStart, -6);
  const leadFilter = tenantId ? { tenantId } : {};
  const auditFilter = tenantId ? { tenantId } : {};

  const [totalLeads, todaysLeads, leadsBySource, recentActivity, dailyLeads] = await Promise.all([
    Lead.countDocuments(leadFilter),
    Lead.countDocuments({ ...leadFilter, createdAt: { $gte: todayStart } }),
    Lead.aggregate([
      { $match: leadFilter },
      {
        $group: {
          _id: { $ifNull: ['$sourceDomain', 'unknown'] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    AuditLog.find(auditFilter).sort({ createdAt: -1 }).limit(8).lean(),
    Lead.aggregate([
      { $match: { ...leadFilter, createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: {
            day: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.day': 1 } }
    ])
  ]);

  const dailyMap = new Map(dailyLeads.map((item) => [item._id.day, item.count]));
  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    const date = addDays(weekStart, idx);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      count: dailyMap.get(key) || 0
    };
  });

  return {
    totalLeads,
    todaysLeads,
    leadsBySource: leadsBySource.map((item) => ({
      sourceDomain: item._id,
      count: item.count
    })),
    recentActivity,
    dailyLeads: last7Days
  };
}
