import { axiosInstance } from '../lib/axios';
import type { CreateLeadRequest, Lead, LeadUpdateInput, LeadsListResponse } from '../types/lead';

// Ingest leads (API key + domain whitelist are handled server-side)
export async function ingestLead(payload: CreateLeadRequest): Promise<Lead> {
  const res = await axiosInstance.post('/api/leads', payload);
  return (res.data?.data ?? res.data) as Lead;
}

// Lead management endpoints (JWT required)
export async function listLeads(params?: Record<string, string | number | boolean | undefined>): Promise<LeadsListResponse> {
  const res = await axiosInstance.get('/api/leads', { params });
  return (res.data?.data ?? res.data) as LeadsListResponse;
}

export async function getLead(id: string): Promise<Lead> {
  const res = await axiosInstance.get(`/api/leads/${encodeURIComponent(id)}`);
  return (res.data?.data ?? res.data) as Lead;
}

export async function updateLead(id: string, payload: LeadUpdateInput): Promise<Lead> {
  const res = await axiosInstance.patch(`/api/leads/${encodeURIComponent(id)}`, payload);
  return (res.data?.data ?? res.data) as Lead;
}

export async function deleteLead(id: string): Promise<{ ok: boolean }> {
  const res = await axiosInstance.delete(`/api/leads/${encodeURIComponent(id)}`);
  return (res.data?.data ?? res.data) as { ok: boolean };
}

export async function listManagedLeads(params?: Record<string, string | number | boolean | undefined>): Promise<LeadsListResponse> {
  return listLeads(params);
}

export async function getManagedLead(id: string): Promise<Lead> {
  return getLead(id);
}

export async function deleteManagedLead(id: string): Promise<{ ok: boolean }> {
  return deleteLead(id);
}
