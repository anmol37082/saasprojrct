"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { Badge, Panel } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { PageShell } from '@/components/ui/PageShell';
import { getClient, updateClient } from '@/services/clientService';
import { useToast } from '@/hooks/useToast';
import type { ClientUpdateInput } from '@/types/client';
import { formatDate, getClientKey, getClientStatistics } from '@/components/clients/client-utils';

type ClientFormState = {
  clientName: string;
  notes: string;
  active: boolean;
  allowedDomains: string;
  subscriptionStatus: string;
};

const emptyState: ClientFormState = {
  clientName: '',
  notes: '',
  active: true,
  allowedDomains: '',
  subscriptionStatus: ''
};

function domainsToText(input: ClientUpdateInput['allowedDomains']) {
  return (input ?? []).map((domain) => domain.domain).join('\n');
}

function parseDomains(value: string): ClientUpdateInput['allowedDomains'] {
  return value
    .split(/[\n,]/g)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((domain) => ({
      domain,
      enabled: true,
      allowSubdomains: false
    }));
}

export default function EditClientPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId ?? '';
  const { toast } = useToast();
  const [form, setForm] = useState<ClientFormState>(emptyState);

  const clientQuery = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => getClient(clientId),
    enabled: clientId.length > 0
  });

  useEffect(() => {
    if (!clientQuery.data) return;
    setForm({
      clientName: clientQuery.data.clientName ?? '',
      notes: clientQuery.data.notes ?? '',
      active: clientQuery.data.active ?? true,
      allowedDomains: domainsToText(clientQuery.data.allowedDomains),
      subscriptionStatus: clientQuery.data.subscriptionStatus ?? clientQuery.data.status ?? ''
    });
  }, [clientQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async () =>
      updateClient(clientId, {
        clientName: form.clientName.trim(),
        notes: form.notes.trim(),
        active: form.active,
        allowedDomains: parseDomains(form.allowedDomains),
        subscriptionStatus: form.subscriptionStatus.trim() || undefined
      }),
    onSuccess: () => {
      toast({ title: 'Client updated', tone: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Update failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const client = clientQuery.data ?? null;
  const stats = client ? getClientStatistics(client) : null;

  return (
    <ProtectedLayout>
      <PageShell
        eyebrow="Clients"
        title="Edit Client"
        description="Update client metadata, status, and allowed domains without duplicating the management surface."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" href={'/clients' as never}>
              Back to clients
            </Link>
            {client ? (
              <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" href={`/clients/${encodeURIComponent(getClientKey(client))}` as never}>
                View Details
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
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Panel title="Edit Form" right={<Badge tone={client.active ? 'emerald' : 'rose'}>{client.active ? 'active' : 'inactive'}</Badge>}>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Client Name" value={form.clientName} onChange={(value) => setForm((current) => ({ ...current, clientName: value }))} required />
                  <Field label="Subscription Status" value={form.subscriptionStatus} onChange={(value) => setForm((current) => ({ ...current, subscriptionStatus: value }))} />
                </div>
                <Field label="Notes" value={form.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} textarea />
                <Field
                  label="Allowed Domains"
                  value={form.allowedDomains}
                  onChange={(value) => setForm((current) => ({ ...current, allowedDomains: value }))}
                  textarea
                  placeholder="example.com\napp.example.com"
                />
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                  />
                  Active
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                    type="button"
                    disabled={updateMutation.isPending}
                    onClick={() => void updateMutation.mutateAsync()}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" href={`/clients/${encodeURIComponent(getClientKey(client))}` as never}>
                    Cancel
                  </Link>
                </div>
              </div>
            </Panel>

            <Panel title="Current Client Snapshot">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Client ID" value={client.clientId ?? getClientKey(client)} />
                  <Info label="Created" value={formatDate(client.createdAt)} />
                  <Info label="Updated" value={formatDate(client.updatedAt)} />
                  <Info label="Allowed Domains" value={String(stats?.allowedDomainCount ?? 0)} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-white">Allowed Domain Preview</div>
                  <div className="flex flex-wrap gap-2">
                    {client.allowedDomains?.length ? (
                      client.allowedDomains.map((domain, index) => (
                        <span key={`${domain.domain}-${index}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                          {domain.domain}
                        </span>
                      ))
                    ) : (
                      <EmptyState title="No domains yet" description="Add one or more domains in the form to the left." />
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        ) : null}
      </PageShell>
    </ProtectedLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  textarea,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      {textarea ? (
        <textarea
          className="min-h-[100px] w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          placeholder={placeholder}
        />
      )}
    </label>
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
