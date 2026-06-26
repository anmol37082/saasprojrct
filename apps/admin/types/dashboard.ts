import type { AuditLog } from './audit';

export type DashboardSummary = {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  totalLeads: number;
  todaysLeads: number;
  weeklyLeads: number;
  monthlyLeads: number;
  conversionRate: number;
  topSources: Array<{ sourceDomain: string; count: number; share: number }>;
  recentActivity: AuditLog[];
  recentClients: Array<{
    _id: string;
    clientName?: string;
    clientId?: string;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }>;
  recentLeads: Array<{
    _id: string;
    name?: string;
    email?: string;
    status?: string;
    sourceDomain?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
  lineChart: Array<{ date: string; count: number }>;
  barChart: Array<{ date: string; count: number; won: number }>;
  pieChart: Array<{ label: string; value: number }>;
  areaChart: Array<{ date: string; count: number; won: number }>;
};
