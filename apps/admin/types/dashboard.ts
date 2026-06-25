import type { AuditLog } from './audit';

export type DashboardSummary = {
  totalLeads: number;
  todaysLeads: number;
  leadsBySource: Array<{ sourceDomain: string; count: number }>;
  recentActivity: AuditLog[];
  dailyLeads: Array<{ date: string; count: number }>;
};

