import { axiosInstance } from '../lib/axios';
import type { DashboardSummary } from '../types/dashboard';

export async function getDashboardSummary(params?: Record<string, string | number | boolean | undefined>): Promise<DashboardSummary> {
  const res = await axiosInstance.get('/api/dashboard/summary', { params });
  return (res.data?.data ?? res.data) as DashboardSummary;
}
