import { axiosInstance } from '../lib/axios';
import type {
  Client,
  ClientCreateInput,
  ClientMutationResult,
  ClientUpdateInput,
  ClientsListResponse
} from '../types/client';

export async function listClients(params?: Record<string, string | number | boolean | undefined>): Promise<ClientsListResponse> {
  const res = await axiosInstance.get('/api/clients', { params });
  return (res.data?.data ?? res.data) as ClientsListResponse;
}

export async function getClient(clientId: string): Promise<Client> {
  const res = await axiosInstance.get(`/api/clients/${encodeURIComponent(clientId)}`);
  return (res.data?.data ?? res.data) as Client;
}

export async function createClient(payload: ClientCreateInput): Promise<ClientMutationResult> {
  const res = await axiosInstance.post('/api/clients', payload);
  return (res.data?.data ?? res.data) as ClientMutationResult;
}

export async function updateClient(clientId: string, payload: ClientUpdateInput): Promise<Client> {
  const res = await axiosInstance.patch(`/api/clients/${encodeURIComponent(clientId)}`, payload);
  return (res.data?.data ?? res.data) as Client;
}

export async function deleteClient(clientId: string): Promise<{ ok: boolean }> {
  const res = await axiosInstance.delete(`/api/clients/${encodeURIComponent(clientId)}`);
  return (res.data?.data ?? res.data) as { ok: boolean };
}

export async function activateClient(clientId: string): Promise<Client> {
  const res = await axiosInstance.post(`/api/clients/${encodeURIComponent(clientId)}/activate`);
  return (res.data?.data ?? res.data) as Client;
}

export async function deactivateClient(clientId: string): Promise<Client> {
  const res = await axiosInstance.post(`/api/clients/${encodeURIComponent(clientId)}/deactivate`);
  return (res.data?.data ?? res.data) as Client;
}

export async function rotateApiKey(
  clientId: string,
  environment = 'prod'
): Promise<ClientMutationResult & { clientId: string }> {
  const res = await axiosInstance.post(`/api/clients/${encodeURIComponent(clientId)}/rotate-api-key`, { environment });
  return (res.data?.data ?? res.data) as ClientMutationResult & { clientId: string };
}

export async function addDomain(
  clientId: string,
  payload: { domain: string; allowSubdomains?: boolean; enabled?: boolean }
): Promise<Client> {
  const res = await axiosInstance.post(`/api/clients/${encodeURIComponent(clientId)}/domains`, payload);
  return (res.data?.data ?? res.data) as Client;
}

export async function removeDomain(clientId: string, domain: string): Promise<Client> {
  const res = await axiosInstance.delete(`/api/clients/${encodeURIComponent(clientId)}/domains`, {
    data: { domain }
  });
  return (res.data?.data ?? res.data) as Client;
}
