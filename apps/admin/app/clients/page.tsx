"use client";

import { useEffect, useMemo, useState } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { PageShell } from '@/components/ui/PageShell';
import { Badge, Panel } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import {
  addDomain,
  createClient,
  deleteClient,
  listClients,
  removeDomain,
  rotateApiKey,
  updateClient
} from '@/services/clientService';
import type { Client, ClientsListResponse } from '@/types/client';
import { useToast } from '@/hooks/useToast';

const blankNewClient = { clientName: '', clientId: '', notes: '', active: true, domains: '' };

function parseDomains(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((domain) => ({ domain, enabled: true, allowSubdomains: false }));
}

export default function ClientsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState({ search: '', active: '' });
  const [data, setData] = useState<ClientsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [newClient, setNewClient] = useState(blankNewClient);
  const [editing, setEditing] = useState<Record<string, Partial<Client> & { domains: string }>>({});
  const [domainDrafts, setDomainDrafts] = useState<Record<string, string>>({});
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const params = useMemo(() => ({ ...filters, page, limit: 10 }), [filters, page]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const result = (await listClients(params)) as ClientsListResponse;
        if (mounted) setData(result);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load clients');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params]);

  const refresh = () => setPage((current) => current);

  const createSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createClient({
        clientName: newClient.clientName,
        clientId: newClient.clientId,
        notes: newClient.notes,
        active: newClient.active,
        allowedDomains: parseDomains(newClient.domains)
      });
      toast({ title: 'Client created', tone: 'success' });
      setNewClient(blankNewClient);
      setPage(1);
    } catch (err) {
      toast({ title: 'Create failed', description: err instanceof Error ? err.message : 'Unknown error', tone: 'error' });
    }
  };

  const saveClient = async (client: Client) => {
    const draft = editing[client._id ?? client.id];
    if (!draft) return;
    try {
      await updateClient(client._id ?? client.id, {
        clientName: draft.clientName,
        notes: draft.notes,
        active: draft.active,
        allowedDomains: draft.domains ? parseDomains(draft.domains) : undefined
      } as Partial<Client>);
      toast({ title: 'Client updated', tone: 'success' });
      setEditing((current) => {
        const next = { ...current };
        delete next[client._id ?? client.id];
        return next;
      });
      setPage(1);
    } catch (err) {
      toast({ title: 'Update failed', description: err instanceof Error ? err.message : 'Unknown error', tone: 'error' });
    }
  };

  const remove = async (client: Client) => {
    if (!window.confirm(`Delete ${client.clientName ?? client.clientId}?`)) return;
    try {
      await deleteClient(client._id ?? client.id);
      toast({ title: 'Client deleted', tone: 'success' });
      setPage(1);
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : 'Unknown error', tone: 'error' });
    }
  };

  const rotate = async (client: Client) => {
    try {
      const result = await rotateApiKey(client._id ?? client.id);
      setGeneratedKey(result.apiKey);
      toast({ title: 'API key rotated', description: 'Copy the new key immediately.', tone: 'success' });
    } catch (err) {
      toast({ title: 'Rotation failed', description: err instanceof Error ? err.message : 'Unknown error', tone: 'error' });
    }
  };

  const handleAddDomain = async (client: Client) => {
    const key = client._id ?? client.id;
    const domain = (domainDrafts[key] ?? '').trim();
    if (!domain) return;
    try {
      await addDomain(key, { domain, enabled: true, allowSubdomains: false });
      toast({ title: 'Domain added', tone: 'success' });
      setDomainDrafts((current) => ({ ...current, [key]: '' }));
      setPage(1);
    } catch (err) {
      toast({ title: 'Domain add failed', description: err instanceof Error ? err.message : 'Unknown error', tone: 'error' });
    }
  };

  const handleRemoveDomain = async (client: Client, domain: string) => {
    try {
      await removeDomain(client._id ?? client.id, domain);
      toast({ title: 'Domain removed', tone: 'success' });
      setPage(1);
    } catch (err) {
      toast({ title: 'Domain remove failed', description: err instanceof Error ? err.message : 'Unknown error', tone: 'error' });
    }
  };

  return (
    <ProtectedLayout>
      <PageShell eyebrow="Management" title="Clients" description="Create, edit, delete, rotate keys, and manage allowed domains.">
        <div className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">
          <Panel title="Add Client">
            <form onSubmit={(event) => void createSubmit(event)} className="space-y-3">
              <Field label="Client Name" value={newClient.clientName} onChange={(value) => setNewClient((current) => ({ ...current, clientName: value }))} required />
              <Field label="Client ID" value={newClient.clientId} onChange={(value) => setNewClient((current) => ({ ...current, clientId: value }))} required />
              <Field label="Notes" value={newClient.notes} onChange={(value) => setNewClient((current) => ({ ...current, notes: value }))} />
              <Field label="Allowed Domains (comma separated)" value={newClient.domains} onChange={(value) => setNewClient((current) => ({ ...current, domains: value }))} />
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={newClient.active} onChange={(e) => setNewClient((current) => ({ ...current, active: e.target.checked }))} />
                Active
              </label>
              <button className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" type="submit">
                Create Client
              </button>
            </form>
            {generatedKey ? <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950/70 p-3 text-xs text-cyan-100">{generatedKey}</pre> : null}
          </Panel>

          <div className="space-y-4">
            <Panel title="Filters">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Search" value={filters.search} onChange={(value) => setFilters((current) => ({ ...current, search: value }))} />
                <Field label="Active (true/false)" value={filters.active} onChange={(value) => setFilters((current) => ({ ...current, active: value }))} />
              </div>
              <div className="mt-3 flex gap-3">
                <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" type="button" onClick={() => setPage(1)}>
                  Apply Filters
                </button>
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                  type="button"
                  onClick={() => {
                    setFilters({ search: '', active: '' });
                    setPage(1);
                  }}
                >
                  Reset
                </button>
              </div>
            </Panel>

            {loading ? <LoadingState label="Loading clients" /> : null}
            {error ? <ErrorState message={error} retry={() => window.location.reload()} /> : null}

            {data ? (
              <Panel title="Client Listing" right={<Badge tone="cyan">{data.total.toLocaleString()} clients</Badge>}>
                {data.items.length ? (
                  <div className="space-y-4">
                    {data.items.map((client) => {
                      const key = client._id ?? client.id;
                      const draft = editing[key] ?? {
                        clientName: client.clientName ?? '',
                        notes: client.notes ?? '',
                        active: client.active ?? true,
                        domains: (client.allowedDomains ?? []).map((entry) => entry.domain).join(', ')
                      };

                      return (
                        <div key={key} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="text-lg font-semibold text-white">{client.clientName ?? client.clientId}</div>
                              <div className="text-sm text-slate-300">{client.clientId}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge tone={client.active ? 'emerald' : 'rose'}>{client.active ? 'active' : 'inactive'}</Badge>
                                <Badge tone="slate">API keys {client.apiKeys?.length ?? 0}</Badge>
                                <Badge tone="slate">Domains {client.allowedDomains?.length ?? 0}</Badge>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white" type="button" onClick={() => setEditing((current) => ({ ...current, [key]: draft }))}>
                                Edit
                              </button>
                              <button className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100" type="button" onClick={() => void rotate(client)}>
                                Rotate API Key
                              </button>
                              <button className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100" type="button" onClick={() => void remove(client)}>
                                Delete
                              </button>
                            </div>
                          </div>

                          {editing[key] ? (
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <Field label="Client Name" value={draft.clientName ?? ''} onChange={(value) => setEditing((current) => ({ ...current, [key]: { ...draft, clientName: value } }))} />
                              <Field label="Notes" value={draft.notes ?? ''} onChange={(value) => setEditing((current) => ({ ...current, [key]: { ...draft, notes: value } }))} />
                              <Field label="Domains" value={draft.domains ?? ''} onChange={(value) => setEditing((current) => ({ ...current, [key]: { ...draft, domains: value } }))} />
                              <label className="flex items-center gap-2 text-sm text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={draft.active ?? true}
                                  onChange={(e) => setEditing((current) => ({ ...current, [key]: { ...draft, active: e.target.checked } }))}
                                />
                                Active
                              </label>
                              <div className="flex gap-2 md:col-span-2">
                                <button className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" type="button" onClick={() => void saveClient(client)}>
                                  Save
                                </button>
                                <button
                                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                                  type="button"
                                  onClick={() =>
                                    setEditing((current) => {
                                      const next = { ...current };
                                      delete next[key];
                                      return next;
                                    })
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : null}

                          <div className="mt-4 space-y-3">
                            <div className="text-sm font-medium text-white">Allowed Domains</div>
                            <div className="flex flex-wrap gap-2">
                              {(client.allowedDomains ?? []).length ? (
                                client.allowedDomains?.map((entry) => (
                                  <button key={entry.domain} type="button" onClick={() => void handleRemoveDomain(client, entry.domain)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                                    {entry.domain} ×
                                  </button>
                                ))
                              ) : (
                                <span className="text-sm text-slate-400">No allowed domains</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <input
                                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                                placeholder="example.com"
                                value={domainDrafts[key] ?? ''}
                                onChange={(e) => setDomainDrafts((current) => ({ ...current, [key]: e.target.value }))}
                              />
                              <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" type="button" onClick={() => void handleAddDomain(client)}>
                                Add Domain
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="No clients found" description="Try a broader search or add a new client." />
                )}
                <div className="mt-5 flex items-center justify-between gap-3 text-sm text-slate-300">
                  <button
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white disabled:opacity-40"
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  >
                    Previous
                  </button>
                  <div>Page {data.page}</div>
                  <button
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white disabled:opacity-40"
                    type="button"
                    disabled={data.items.length < data.limit}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </button>
                </div>
              </Panel>
            ) : null}
          </div>
        </div>
      </PageShell>
    </ProtectedLayout>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}

