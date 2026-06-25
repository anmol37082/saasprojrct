import { axiosInstance } from '../lib/axios';
import type { Lead, LeadsListResponse, CreateLeadRequest } from '../types/lead';

// Ingest leads (API key + domain whitelist are handled server-side)
export async function ingestLead(payload: CreateLeadRequest): Promise<Lead> {
  const res = await axiosInstance.post('/api/leads', payload);
  return (res.data?.data ?? res.data) as Lead;
}

// Lead management endpoints (JWT required)
export async function listManagedLeads(params?: Record<string, string | number | boolean | undefined>): Promise<LeadsListResponse> {
  const res = await axiosInstance.get('/api/leads-management', { params });
  return (res.data?.data ?? res.data) as LeadsListResponse;
}

export async function getManagedLead(id: string): Promise<Lead> {
  const res = await axiosInstance.get(`/api/leads-management/${encodeURIComponent(id)}`);
  return (res.data?.data ?? res.data) as Lead;
}

export async function deleteManagedLead(id: string): Promise<{ success: boolean }> {
  const res = await axiosInstance.delete(`/api/leads-management/${encodeURIComponent(id)}`);
  return (res.data?.data ?? res.data) as { success: boolean };
}
