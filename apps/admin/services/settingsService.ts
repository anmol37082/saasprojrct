import { axiosInstance } from '../lib/axios';
import type { SettingsShape, SettingsUpdateInput } from '../types/settings';

export async function getSettings(): Promise<SettingsShape> {
  const res = await axiosInstance.get('/api/settings');
  return (res.data?.data ?? res.data) as SettingsShape;
}

export async function saveSettings(payload: SettingsUpdateInput): Promise<SettingsShape> {
  const res = await axiosInstance.put('/api/settings', payload);
  return (res.data?.data ?? res.data) as SettingsShape;
}
