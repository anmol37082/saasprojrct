import { axiosInstance } from '../lib/axios';
import type { ChangePasswordInput, Profile, ProfileUpdateInput, SessionRecord } from '../types/profile';

export async function getProfile(): Promise<Profile> {
  const res = await axiosInstance.get('/api/auth/me');
  return (res.data?.data ?? res.data) as Profile;
}

export async function updateProfile(payload: ProfileUpdateInput): Promise<Profile> {
  const res = await axiosInstance.patch('/api/auth/profile', payload);
  return (res.data?.data ?? res.data) as Profile;
}

export async function changePassword(payload: ChangePasswordInput): Promise<{ ok: boolean }> {
  const { confirmPassword: _confirmPassword, ...body } = payload;
  const res = await axiosInstance.patch('/api/auth/password', body);
  return (res.data?.data ?? res.data) as { ok: boolean };
}

export async function getSessions(): Promise<{ items: SessionRecord[] }> {
  const res = await axiosInstance.get('/api/auth/sessions');
  return (res.data?.data ?? res.data) as { items: SessionRecord[] };
}

export async function logoutAllDevices(): Promise<{ ok: boolean }> {
  const res = await axiosInstance.post('/api/auth/logout-all');
  return (res.data?.data ?? res.data) as { ok: boolean };
}
