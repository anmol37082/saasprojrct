"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { Badge, Panel, StatCard } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { PageShell } from '@/components/ui/PageShell';
import {
  activateClient,
  addDomain,
  deleteClient,
  deactivateClient,
  getClient,
  removeDomain,
  rotateApiKey
} from '@/services/clientService';
import { useToast } from '@/hooks/useToast';
import type { Client, ClientDomain, ClientSnippet } from '@/types/client';
import {
  buildIntegrationSnippets,
  formatDate,
  getClientKey,
  getClientStatistics,
  getLatestApiKey,
  getLatestApiUsage
} from '@/components/clients/client-utils';

type DomainDraft = {
  domain: string;
  allowSubdomains: boolean;
  enabled: boolean;
};

const emptyDraft: DomainDraft = {
  domain: '',
  allowSubdomains: false,
  enabled: true
};

export default function ClientDetailsPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId ?? '';
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<DomainDraft>(emptyDraft);

  const clientQuery = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClient(clientId),
    enabled: clientId.length > 0
  });

  const client = clientQuery.data ?? null;
  const stats = client ? getClientStatistics(client) : null;
  const latestKey = client ? getLatestApiKey(client) : null;
  const snippets = useMemo<ClientSnippet[]>(
    () =>
      buildIntegrationSnippets({
        clientId: client?.clientId ?? clientId,
        apiKeyPlaceholder: '{{API_KEY}}'
      }),
    [client?.clientId, clientId]
  );

  const refreshClient = async () => {
    await queryClient.invalidateQueries({ queryKey: ['client', clientId] });
    await queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const rotateMutation = useMutation({
    mutationFn: () => rotateApiKey(clientId),
    onSuccess: async (result) => {
      setGeneratedKey(result.apiKey ?? null);
      toast({ title: 'API key rotated', tone: 'success', description: 'Copy the new key immediately.' });
      await refreshClient();
    },
    onError: (error) => {
      toast({ title: 'Rotation failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Client not loaded');
      return client.active ? deactivateClient(clientId) : activateClient(clientId);
    },
    onSuccess: async (updated) => {
      toast({ title: updated.active ? 'Client enabled' : 'Client disabled', tone: 'success' });
      await refreshClient();
    },
    onError: (error) => {
      toast({ title: 'Status update failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Client not loaded');
      const title = client.clientName ?? client.clientId ?? clientId;
      if (!window.confirm(`Delete ${title}? This cannot be undone.`)) return false;
      await deleteClient(clientId);
      return true;
    },
    onSuccess: async (deleted) => {
      if (!deleted) return;
      toast({ title: 'Client deleted', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push('/clients');
    },
    onError: (error) => {
      toast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const addDomainMutation = useMutation({
    mutationFn: async () => {
      if (!draft.domain.trim()) throw new Error('Domain is required');
      return addDomain(clientId, {
        domain: draft.domain.trim(),
        allowSubdomains: draft.allowSubdomains,
        enabled: draft.enabled
      });
    },
    onSuccess: async () => {
      setDraft(emptyDraft);
      toast({ title: 'Domain added', tone: 'success' });
      await refreshClient();
    },
    onError: (error) => {
      toast({ title: 'Unable to add domain', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const removeDomainMutation = useMutation({
    mutationFn: (domain: string) => removeDomain(clientId, domain),
    onSuccess: async () => {
      toast({ title: 'Domain removed', tone: 'success' });
      await refreshClient();
    },
    onError: (error) => {
      toast({ title: 'Unable to remove domain', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  return (
    <ProtectedLayout>
      <PageShell
        eyebrow="Clients"
        title="Client Details"
        description="Inspect client metadata, rotate keys, manage domains, and copy integration snippets."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" href={'/clients' as never}>
              Back to clients
            </Link>
            {client ? (
              <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" href={`/clients/${encodeURIComponent(clientId)}/edit` as never}>
                Edit Client
              </Link>
            ) : null}
          </div>
        }
      >
        {clientQuery.isLoading ? <LoadingState label="Loading client" /> : null}
        {clientQuery.isError ? (
          <ErrorState
            message={clientQuery.error instanceof Error ? clientQuery.error.message : 'Unable to load client'}
            retry={() => void clientQuery.refetch()}
          />
        ) : null}

        {client ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="API Keys" value={stats?.apiKeyCount ?? 0} hint="stored credentials" />
              <StatCard label="Active Keys" value={stats?.activeApiKeyCount ?? 0} hint="currently usable" />
              <StatCard label="Allowed Domains" value={stats?.allowedDomainCount ?? 0} hint="domain whitelist" />
              <StatCard label="Last API Usage" value={formatDate(stats?.lastApiUsage ?? client.lastApiUsage ?? null)} hint="most recent use" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel
                title="API Key Panel"
                right={
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={client.active ? 'emerald' : 'rose'}>{client.active ? 'active' : 'inactive'}</Badge>
                    <Badge tone="slate">{latestKey?.environment ?? stats?.latestApiKeyEnvironment ?? 'prod'}</Badge>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info label="Client ID" value={client.clientId ?? getClientKey(client)} />
                    <Info label="Client Name" value={client.clientName ?? 'N/A'} />
                    <Info label="Created" value={formatDate(client.createdAt)} />
                    <Info label="Updated" value={formatDate(client.updatedAt)} />
                    <Info label="Last API Usage" value={formatDate(getLatestApiUsage(client))} />
                    <Info label="Integration Status" value={client.active ? 'Ready' : 'Disabled'} />
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Current API Key</div>
                        <div className="mt-1 text-sm text-slate-300">
                          {generatedKey ? 'This raw key is visible because you just rotated it.' : 'Rotate the key to reveal a raw value one time.'}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {generatedKey ? <CopyButton text={generatedKey} label="Copy API Key" /> : null}
                        <button
                          className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 disabled:opacity-60"
                          type="button"
                          disabled={rotateMutation.isPending}
                          onClick={() => void rotateMutation.mutateAsync()}
                        >
                          Rotate API Key
                        </button>
                      </div>
                    </div>
                    <pre className="mt-3 overflow-auto rounded-2xl bg-slate-950/70 p-3 text-xs text-cyan-100">
                      {generatedKey ?? 'API key hidden. Rotate to generate a fresh key.'}
                    </pre>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 disabled:opacity-60"
                      type="button"
                      disabled={toggleMutation.isPending}
                      onClick={() => void toggleMutation.mutateAsync()}
                    >
                      {client.active ? 'Disable Client' : 'Enable Client'}
                    </button>
                    <button
                      className="rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 disabled:opacity-60"
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => void deleteMutation.mutateAsync()}
                    >
                      Delete Client
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-medium text-white">Stored API Key Metadata</div>
                    {client.apiKeys?.length ? (
                      <div className="space-y-3">
                        {client.apiKeys.map((entry, index) => (
                          <div key={`${entry.label ?? 'key'}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-white">{entry.label ?? `Key ${index + 1}`}</div>
                                <div className="text-xs text-slate-400">{entry.environment ?? 'prod'}</div>
                              </div>
                              <Badge tone={entry.status === 'active' ? 'emerald' : entry.status === 'revoked' ? 'rose' : 'slate'}>
                                {entry.status ?? 'active'}
                              </Badge>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <Info label="Created" value={formatDate(entry.createdAt)} />
                              <Info label="Rotated" value={formatDate(entry.rotatedAt)} />
                              <Info label="Last Used" value={formatDate(entry.lastUsedAt)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState title="No stored keys" description="Rotate a key to create the first credential." />
                    )}
                  </div>
                </div>
              </Panel>

              <Panel title="Allowed Domains">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-white">Current Domains</div>
                    <div className="flex flex-wrap gap-2">
                      {client.allowedDomains?.length ? (
                        client.allowedDomains.map((entry, index) => (
                          <DomainChip
                            key={`${entry.domain}-${index}`}
                            domain={entry}
                            onRemove={() => void removeDomainMutation.mutateAsync(entry.domain)}
                          />
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">No allowed domains configured</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-medium text-white">Add Domain</div>
                    <label className="space-y-1 text-sm text-slate-300">
                      <span>Domain</span>
                      <input
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                        placeholder="example.com"
                        value={draft.domain}
                        onChange={(event) => setDraft((current) => ({ ...current, domain: event.target.value }))}
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={draft.allowSubdomains}
                          onChange={(event) => setDraft((current) => ({ ...current, allowSubdomains: event.target.checked }))}
                        />
                        Allow subdomains
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))}
                        />
                        Enabled
                      </label>
                    </div>
                    <button
                      className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                      type="button"
                      disabled={addDomainMutation.isPending}
                      onClick={() => void addDomainMutation.mutateAsync()}
                    >
                      Add Domain
                    </button>
                  </div>
                </div>
              </Panel>
            </div>

            <Panel title="Integration Snippets">
              <div className="grid gap-4 lg:grid-cols-2">
                {snippets.map((snippet) => (
                  <SnippetCard key={snippet.title} snippet={snippet} />
                ))}
              </div>
            </Panel>
          </div>
        ) : null}
      </PageShell>
    </ProtectedLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-3">
      <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm text-white">{value}</div>
    </div>
  );
}

function DomainChip({ domain, onRemove }: { domain: ClientDomain; onRemove: () => void }) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
      type="button"
      onClick={onRemove}
    >
      <span>{domain.domain}</span>
      <span className="text-slate-400">{domain.allowSubdomains ? 'subdomains' : 'exact'}</span>
      <span className={domain.enabled === false ? 'text-rose-200' : 'text-emerald-200'}>{domain.enabled === false ? 'disabled' : 'enabled'}</span>
      <span>x</span>
    </button>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const { toast } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard', tone: 'success' });
  };

  return (
    <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white" type="button" onClick={() => void copy()}>
      {label}
    </button>
  );
}

function SnippetCard({ snippet }: { snippet: ClientSnippet }) {
  const { toast } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(snippet.code);
    toast({ title: `${snippet.title} copied`, tone: 'success' });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{snippet.title}</div>
          <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{snippet.language}</div>
        </div>
        <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white" type="button" onClick={() => void copy()}>
          Copy
        </button>
      </div>
      <pre className="mt-3 overflow-auto rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-200">{snippet.code}</pre>
    </div>
  );
}

