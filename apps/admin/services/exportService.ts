import { axiosInstance } from '../lib/axios';

export async function exportCsv(params?: Record<string, string | number | undefined>): Promise<Blob> {
  const res = await axiosInstance.get('/api/exports/csv', { responseType: 'blob', params });
  return res.data as Blob;
}

export async function exportXlsx(params?: Record<string, string | number | undefined>): Promise<Blob> {
  const res = await axiosInstance.get('/api/exports/xlsx', { responseType: 'blob', params });
  return res.data as Blob;
}
