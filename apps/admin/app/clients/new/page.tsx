"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { Badge, Panel } from '@/components/ui/Cards';
import { ErrorState } from '@/components/ui/States';
import { PageShell } from '@/components/ui/PageShell';
import { createClient } from '@/services/clientService';
import { useToast } from '@/hooks/useToast';
import type { ClientCreateInput, ClientMutationResult } from '@/types/client';
import { buildIntegrationSnippets, formatDate, getClientKey, getClientStatistics } from '@/components/clients/client-utils';

type ClientFormState = {
  clientName: string;
  clientId: string;
  notes: string;
  active: boolean;
  environment: 'prod' | 'sandbox';
  allowedDomains: string;
};

const initialState: ClientFormState = {
  clientName: '',
  clientId: '',
  notes: '',
  active: true,
  environment: 'prod',
  allowedDomains: ''
};

function parseDomains(value: string): ClientCreateInput['allowedDomains'] {
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

export default function NewClientPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<ClientFormState>(initialState);
  const [created, setCreated] = useState<ClientMutationResult | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: ClientCreateInput) => createClient(payload),
    onSuccess: (result) => {
      setCreated(result);
      toast({ title: 'Client created', tone: 'success', description: 'The API key is shown once on this screen.' });
    },
    onError: (error) => {
      toast({ title: 'Create failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const snippets = useMemo(() => {
    const clientId = (created?.client.clientId ?? form.clientId.trim()) || 'client-id';
    return buildIntegrationSnippets({
      clientId,
      apiKeyPlaceholder: '{{API_KEY}}'
    });
  }, [created?.client.clientId, form.clientId]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await createMutation.mutateAsync({
      clientName: form.clientName.trim(),
      clientId: form.clientId.trim(),
      notes: form.notes.trim(),
      active: form.active,
      environment: form.environment,
      allowedDomains: parseDomains(form.allowedDomains)
    });
  };

  const client = created?.client;
  const stats = client ? getClientStatistics(client) : null;
  const apiKey = created?.apiKey ?? '';

  return (
    <ProtectedLayout>
      <PageShell
        eyebrow="Clients"
        title="Create Client"
        description="Create a client, generate the first API key, and copy the key before you leave the page."
        actions={<Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" href={'/clients' as never}>Back to clients</Link>}
      >
        <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <Panel title="New Client">
            <form onSubmit={(event) => void submit(event)} className="space-y-4">
              <Field label="Client Name" value={form.clientName} onChange={(value) => setForm((current) => ({ ...current, clientName: value }))} required />
              <Field label="Client ID" value={form.clientId} onChange={(value) => setForm((current) => ({ ...current, clientId: value }))} required />
              <Field label="Notes" value={form.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} textarea />
              <Field
                label="Allowed Domains"
                value={form.allowedDomains}
                onChange={(value) => setForm((current) => ({ ...current, allowedDomains: value }))}
                textarea
                placeholder="example.com\napp.example.com"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm text-slate-300">
                  <span>Environment</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
                    value={form.environment}
                    onChange={(event) => setForm((current) => ({ ...current, environment: event.target.value as ClientFormState['environment'] }))}
                  >
                    <option value="prod">Production</option>
                    <option value="sandbox">Sandbox</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 self-end text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                  />
                  Active
                </label>
              </div>
              <button
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                type="submit"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Client'}
              </button>
            </form>
            {createMutation.isError ? (
              <div className="mt-4">
                <ErrorState
                  message={createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create client'}
                  retry={() => createMutation.reset()}
                />
              </div>
            ) : null}
          </Panel>

          <div className="space-y-6">
            {client ? (
              <Panel title="Created Client" right={<Badge tone={client.active ? 'emerald' : 'rose'}>{client.active ? 'active' : 'inactive'}</Badge>}>
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info label="Client Name" value={client.clientName ?? 'N/A'} />
                    <Info label="Client ID" value={client.clientId ?? getClientKey(client)} />
                    <Info label="Created" value={formatDate(client.createdAt)} />
                    <Info label="Updated" value={formatDate(client.updatedAt)} />
                    <Info label="Allowed Domains" value={String(stats?.allowedDomainCount ?? 0)} />
                    <Info label="API Keys" value={String(stats?.apiKeyCount ?? 0)} />
                  </div>
                  <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.3em] text-cyan-100/70">API Key</div>
                        <div className="mt-1 text-sm text-cyan-50">Copy this value now. It is only shown once.</div>
                      </div>
                      <CopyButton text={apiKey} label="Copy API Key" />
                    </div>
                    <pre className="mt-3 overflow-auto rounded-2xl bg-slate-950/70 p-3 text-xs text-cyan-100">{apiKey}</pre>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                      href={`/clients/${encodeURIComponent(getClientKey(client))}` as never}
                    >
                      View Details
                    </Link>
                    <Link
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                      href={`/clients/${encodeURIComponent(getClientKey(client))}/edit` as never}
                    >
                      Edit Client
                    </Link>
                  </div>
                </div>
              </Panel>
            ) : null}

            <Panel title="Integration Snippets">
              <div className="grid gap-4">
                {snippets.map((snippet) => (
                  <SnippetCard key={snippet.title} title={snippet.title} code={snippet.code} />
                ))}
              </div>
            </Panel>
          </div>
        </div>
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
    <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
      <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm text-white">{value}</div>
    </div>
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

function SnippetCard({ title, code }: { title: string; code: string }) {
  const { toast } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    toast({ title: `${title} copied`, tone: 'success' });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Copy-ready integration snippet</div>
        </div>
        <button className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white" type="button" onClick={() => void copy()}>
          Copy
        </button>
      </div>
      <pre className="mt-3 overflow-auto rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-200">{code}</pre>
    </div>
  );
}
