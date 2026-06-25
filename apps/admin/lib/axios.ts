import axios from 'axios';
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from './auth-storage';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const rawAxios = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await rawAxios.post('/api/auth/refresh', { refreshToken });
  const payload = response.data?.data ?? response.data;
  const nextAccessToken = payload?.accessToken ?? null;
  const nextRefreshToken = payload?.refreshToken ?? refreshToken;

  if (!nextAccessToken) return null;

  setAuthTokens({ accessToken: nextAccessToken, refreshToken: nextRefreshToken });
  return nextAccessToken;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        refreshPromise = refreshPromise ?? refreshAccessToken();
        const token = await refreshPromise;
        refreshPromise = null;

        if (token) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
      } catch {
        refreshPromise = null;
        clearAuthTokens();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }

      try {
        clearAuthTokens();
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function readAuthSnapshot() {
  return {
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken()
  };
}


