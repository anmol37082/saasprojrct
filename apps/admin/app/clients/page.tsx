"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { Badge, Panel, StatCard } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { PageShell } from '@/components/ui/PageShell';
import { activateClient, deactivateClient, deleteClient, listClients, rotateApiKey } from '@/services/clientService';
import type { Client } from '@/types/client';
import { useToast } from '@/hooks/useToast';
import { formatDate, getClientKey, getClientStatistics, getLatestApiKey } from '@/components/clients/client-utils';

type ClientFilters = {
  search: string;
  status: 'all' | 'active' | 'inactive';
};

const defaultFilters: ClientFilters = {
  search: '',
  status: 'all'
};

function buildQuery(filters: ClientFilters, page: number) {
  const params: Record<string, string | number | undefined> = {
    page,
    limit: 10
  };

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.status !== 'all') params.status = filters.status;

  return params;
}

export default function ClientsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ClientFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [generatedKey, setGeneratedKey] = useState<{ key: string; clientName: string; environment?: string } | null>(null);

  const queryParams = useMemo(() => buildQuery(filters, page), [filters, page]);

  const clientsQuery = useQuery({
    queryKey: ['clients', queryParams],
    queryFn: () => listClients(queryParams)
  });

  const deleteMutation = useMutation({
    mutationFn: async (client: Client) => {
      const id = getClientKey(client);
      if (!window.confirm(`Delete ${client.clientName ?? client.clientId ?? id}?`)) return null;
      await deleteClient(id);
      return client;
    },
    onSuccess: (client) => {
      if (!client) return;
      toast({ title: 'Client deleted', tone: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      toast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async (client: Client) => {
      const id = getClientKey(client);
      return client.active ? deactivateClient(id) : activateClient(id);
    },
    onSuccess: (client) => {
      toast({
        title: client.active ? 'Client enabled' : 'Client disabled',
        tone: 'success'
      });
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      toast({ title: 'Unable to update client status', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const rotateMutation = useMutation({
    mutationFn: async (client: Client) => {
      const id = getClientKey(client);
      return rotateApiKey(id);
    },
    onSuccess: (result, client) => {
      setGeneratedKey({
        key: result.apiKey ?? '',
        clientName: client.clientName ?? client.clientId ?? getClientKey(client),
        environment: result.environment
      });
      toast({ title: 'API key rotated', description: 'Copy the new key immediately.', tone: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      toast({ title: 'Rotation failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const clients = clientsQuery.data?.items ?? [];
  const total = clientsQuery.data?.total ?? 0;
  const activeCount = clients.filter((client) => client.active).length;
  const inactiveCount = clients.filter((client) => !client.active).length;
  const keyCount = clients.reduce((sum, client) => sum + getClientStatistics(client).apiKeyCount, 0);

  return (
    <ProtectedLayout>
      <PageShell
        eyebrow="Management"
        title="Clients"
        description="Search clients, inspect key health, manage access, and jump into create/edit/detail workflows."
        actions={
          <Link className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" href={'/clients/new' as never}>
            Create Client
          </Link>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Clients" value={total.toLocaleString()} hint="matching current filters" />
          <StatCard label="Active Clients" value={activeCount.toLocaleString()} hint="enabled right now" />
          <StatCard label="Inactive Clients" value={inactiveCount.toLocaleString()} hint="disabled or paused" />
          <StatCard label="API Keys" value={keyCount.toLocaleString()} hint="stored credentials" />
        </div>

        {generatedKey ? (
          <Panel
            title="Latest API Key"
            right={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="cyan">{generatedKey.environment ?? 'prod'}</Badge>
                <CopyButton text={generatedKey.key} />
              </div>
            }
          >
            <div className="space-y-3">
              <div className="text-sm text-slate-300">
                {generatedKey.clientName} has a new API key. Copy it now because the raw value is never stored.
              </div>
              <pre className="overflow-auto rounded-2xl bg-slate-950/70 p-3 text-xs text-cyan-100">{generatedKey.key}</pre>
            </div>
          </Panel>
        ) : null}

        <Panel title="Filters">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_0.8fr_auto]">
            <label className="space-y-1 text-sm text-slate-300">
              <span>Search</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                value={filters.search}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, search: event.target.value }));
                  setPage(1);
                }}
                placeholder="Client name, ID, or notes"
              />
            </label>
            <label className="space-y-1 text-sm text-slate-300">
              <span>Status</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
                value={filters.status}
                onChange={(event) => {
                  setFilters((current) => ({ ...current, status: event.target.value as ClientFilters['status'] }));
                  setPage(1);
                }}
              >
                <option value="all">All clients</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <div className="flex items-end gap-3">
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => {
                  setFilters(defaultFilters);
                  setPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </Panel>

        {clientsQuery.isLoading ? <LoadingState label="Loading clients" /> : null}
        {clientsQuery.isError ? (
          <ErrorState
            message={clientsQuery.error instanceof Error ? clientsQuery.error.message : 'Failed to load clients'}
            retry={() => void clientsQuery.refetch()}
          />
        ) : null}

        {clientsQuery.data ? (
          <Panel title="Client Directory" right={<Badge tone="cyan">{total.toLocaleString()} total</Badge>}>
            {clients.length ? (
              <div className="space-y-4">
                {clients.map((client) => {
                  const stats = getClientStatistics(client);
                  const latestKey = getLatestApiKey(client);
                  const key = getClientKey(client);

                  return (
                    <article key={key} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold text-white">{client.clientName ?? client.clientId ?? key}</h3>
                            <Badge tone={client.active ? 'emerald' : 'rose'}>{client.active ? 'active' : 'inactive'}</Badge>
                            <Badge tone="slate">{stats.apiKeyCount} keys</Badge>
                            <Badge tone="slate">{stats.allowedDomainCount} domains</Badge>
                          </div>
                          <div className="mt-1 text-sm text-slate-300">{client.clientId ?? key}</div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <MiniStat label="Created" value={formatDate(client.createdAt)} />
                            <MiniStat label="Updated" value={formatDate(client.updatedAt)} />
                            <MiniStat label="Last API usage" value={formatDate(stats.lastApiUsage ?? client.lastApiUsage ?? null)} />
                            <MiniStat label="Latest key env" value={latestKey?.environment ?? stats.latestApiKeyEnvironment ?? 'prod'} />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
                            href={`/clients/${encodeURIComponent(key)}` as never}
                          >
                            View
                          </Link>
                          <Link
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
                            href={`/clients/${encodeURIComponent(key)}/edit` as never}
                          >
                            Edit
                          </Link>
                          <button
                            className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 disabled:opacity-60"
                            type="button"
                            disabled={rotateMutation.isPending}
                            onClick={() => void rotateMutation.mutateAsync(client)}
                          >
                            Rotate API Key
                          </button>
                          <button
                            className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100 disabled:opacity-60"
                            type="button"
                            disabled={toggleMutation.isPending}
                            onClick={() => void toggleMutation.mutateAsync(client)}
                          >
                            {client.active ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 disabled:opacity-60"
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() => void deleteMutation.mutateAsync(client)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No clients found" description="Try a different search or create a new client." />
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
              <div>
                Page {clientsQuery.data.page} of {clientsQuery.data.totalPages ?? Math.max(Math.ceil(total / (clientsQuery.data.limit || 1)), 1)}
              </div>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white disabled:opacity-40"
                type="button"
                disabled={clients.length < (clientsQuery.data.limit ?? 10)}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </Panel>
        ) : null}
      </PageShell>
    </ProtectedLayout>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-3">
      <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm text-white">{value ?? 'N/A'}</div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const { toast } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard', tone: 'success' });
  };

  return (
    <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white" type="button" onClick={() => void copy()}>
      Copy API Key
    </button>
  );
}
