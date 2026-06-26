import { axiosInstance } from '../lib/axios';
import type { AuthResponse, LoginRequest, RefreshRequest } from '../types/auth';

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const res = await axiosInstance.post('/api/auth/login', payload);
  return (res.data?.data ?? res.data) as AuthResponse;
}

export async function refresh(payload: RefreshRequest): Promise<AuthResponse> {
  const res = await axiosInstance.post('/api/auth/refresh', payload);
  return (res.data?.data ?? res.data) as AuthResponse;
}

export async function logout(refreshToken?: string): Promise<void> {
  await axiosInstance.post('/api/auth/logout', refreshToken ? { refreshToken } : undefined);
}

export async function me<T = unknown>(): Promise<T> {
  const res = await axiosInstance.get('/api/auth/me');
  return (res.data?.data ?? res.data) as T;
}
