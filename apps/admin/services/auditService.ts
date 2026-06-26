import { axiosInstance } from '../lib/axios';
import type { AuditLogsResponse } from '../types/audit';

export async function listAuditLogs(params?: Record<string, string | number | boolean | undefined>): Promise<AuditLogsResponse> {
  const res = await axiosInstance.get('/api/audit-logs', { params });
  return (res.data?.data ?? res.data) as AuditLogsResponse;
}

export async function getDashboardSummary(): Promise<unknown> {
  const res = await axiosInstance.get('/api/dashboard/summary');
  return res.data?.data ?? res.data;
}
