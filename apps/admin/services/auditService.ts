import { axiosInstance } from '../lib/axios';

export async function listAuditLogs(params?: Record<string, string | number | boolean | undefined>): Promise<unknown> {
  const res = await axiosInstance.get('/api/audit-logs', { params });
  return res.data?.data ?? res.data;
}

export async function getDashboardSummary(): Promise<unknown> {
  const res = await axiosInstance.get('/api/dashboard/summary');
  return res.data?.data ?? res.data;
}
