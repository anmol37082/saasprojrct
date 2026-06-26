"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { Badge, Panel, StatCard } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { PageShell } from '@/components/ui/PageShell';
import { LeadTimeline } from '@/components/leads/LeadTimeline';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { deleteLead, getLead, updateLead } from '@/services/leadService';
import { listAuditLogs } from '@/services/auditService';
import { useToast } from '@/hooks/useToast';
import type { AuditLog } from '@/types/audit';
import type { Lead, LeadStatusOption } from '@/types/lead';

const leadStatuses = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost',
  'deleted'
] as const;

function getLeadKey(lead: Lead) {
  return lead._id ?? lead.id;
}

function toText(value: unknown) {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value || 'N/A';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return 'N/A';
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

export default function LeadDetailsPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params?.leadId ?? '';
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusDraft, setStatusDraft] = useState('new');

  const leadQuery = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => getLead(leadId),
    enabled: leadId.length > 0
  });

  const auditQuery = useQuery({
    queryKey: ['lead-audit-logs', leadId],
    queryFn: () => listAuditLogs({ page: 1, limit: 100, search: leadId, resource: 'Lead' }),
    enabled: leadId.length > 0
  });

  const lead = leadQuery.data ?? null;

  useEffect(() => {
    setStatusDraft(lead?.status ?? 'new');
  }, [lead?.status]);

  const timelineItems = useMemo<AuditLog[]>(() => {
    const items = auditQuery.data?.items ?? [];
    return items.filter((item) => item.resourceId === leadId);
  }, [auditQuery.data, leadId]);

  const refreshData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
    await queryClient.invalidateQueries({ queryKey: ['leads'] });
    await queryClient.invalidateQueries({ queryKey: ['lead-audit-logs', leadId] });
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error('Lead not loaded');
      if (!statusDraft.trim()) throw new Error('Status is required');
      return updateLead(leadId, { status: statusDraft as LeadStatusOption });
    },
    onSuccess: async () => {
      toast({ title: 'Lead updated', tone: 'success' });
      await refreshData();
    },
    onError: (error) => {
      toast({ title: 'Status update failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!lead) throw new Error('Lead not loaded');
      const title = lead.name ?? lead.promotedFields?.name ?? lead.email ?? leadId;
      if (!window.confirm(`Delete ${toText(title)}? This will mark the lead as deleted.`)) return false;
      await deleteLead(leadId);
      return true;
    },
    onSuccess: async (deleted) => {
      if (!deleted) return;
      toast({ title: 'Lead deleted', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
      router.push('/leads' as never);
    },
    onError: (error) => {
      toast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const latestActivity = timelineItems[0]?.createdAt ?? lead?.updatedAt ?? lead?.createdAt ?? null;
  const metadata = toRecord(lead?.metadata);
  const promotedFields = toRecord(lead?.promotedFields);
  const dynamicData = toRecord(lead?.dynamicData);

  return (
    <ProtectedLayout>
      <PageShell
        eyebrow="Management"
        title="Lead Details"
        description="Inspect lead metadata, review the timeline, and manage the lead lifecycle in one view."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" href={'/leads' as never}>
              Back to leads
            </Link>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-60"
              type="button"
              onClick={() => void refreshData()}
              disabled={leadQuery.isFetching || auditQuery.isFetching}
            >
              Refresh
            </button>
          </div>
        }
      >
        {leadQuery.isLoading ? <LoadingState label="Loading lead" /> : null}

        {leadQuery.isError ? (
          <ErrorState
            message={leadQuery.error instanceof Error ? leadQuery.error.message : 'Unable to load lead'}
            retry={() => void leadQuery.refetch()}
          />
        ) : null}

        {lead ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Status" value={<LeadStatusBadge status={lead.status} />} hint="current lifecycle state" />
              <StatCard label="Created" value={formatDate(lead.createdAt)} hint="initial submission" />
              <StatCard label="Updated" value={formatDate(lead.updatedAt)} hint="last record change" />
              <StatCard label="Last Activity" value={formatDate(latestActivity)} hint="latest timeline event" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Panel
                title="Lead Overview"
                right={
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="slate">{lead.sourceDomain ?? 'unknown source'}</Badge>
                    <Badge tone={lead.status === 'deleted' ? 'rose' : 'cyan'}>{lead.status ?? 'new'}</Badge>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info label="Lead ID" value={getLeadKey(lead)} />
                    <Info label="Client ID" value={toText(lead.clientId)} />
                    <Info label="Tenant ID" value={toText(lead.tenantId)} />
                    <Info label="Lead External ID" value={toText(lead.leadExternalId)} />
                    <Info label="Source Domain" value={toText(lead.sourceDomain)} />
                    <Info label="Referer" value={toText(lead.referer)} />
                    <Info label="IP Address" value={toText(lead.ipAddress)} />
                    <Info label="Schema Version" value={toText(lead.schemaVersion)} />
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-white">Update Status</div>
                        <label className="block space-y-1 text-sm text-slate-300">
                          <span>Lead Status</span>
                          <select
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
                            value={statusDraft}
                            onChange={(event) => setStatusDraft(event.target.value)}
                          >
                            {leadStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
                          type="button"
                          disabled={updateMutation.isPending || statusDraft === (lead.status ?? 'new')}
                          onClick={() => void updateMutation.mutateAsync()}
                        >
                          {updateMutation.isPending ? 'Updating...' : 'Update Status'}
                        </button>
                        <button
                          className="rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 disabled:opacity-60"
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => void deleteMutation.mutateAsync()}
                        >
                          {deleteMutation.isPending ? 'Deleting...' : 'Delete Lead'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info label="Name" value={toText(lead.name ?? promotedFields.name ?? dynamicData.name ?? dynamicData.fullName)} />
                    <Info label="Email" value={toText(lead.email ?? promotedFields.email ?? dynamicData.email)} />
                    <Info label="Phone" value={toText(lead.phone ?? promotedFields.phone ?? dynamicData.phone)} />
                    <Info label="User Agent" value={toText(lead.userAgent)} />
                  </div>
                </div>
              </Panel>

              <Panel title="Audit Timeline">
                {auditQuery.isLoading ? <LoadingState label="Loading timeline" /> : null}
                {auditQuery.isError ? (
                  <ErrorState
                    message={auditQuery.error instanceof Error ? auditQuery.error.message : 'Unable to load timeline'}
                    retry={() => void auditQuery.refetch()}
                  />
                ) : null}
                {!auditQuery.isLoading && !auditQuery.isError ? <LeadTimeline items={timelineItems} /> : null}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Metadata">
                {Object.keys(metadata).length ? <KeyValueList entries={metadata} /> : <EmptyState title="No metadata stored" description="This lead does not include metadata yet." />}
              </Panel>

              <Panel title="Promoted Fields">
                {Object.keys(promotedFields).length ? <KeyValueList entries={promotedFields} /> : <EmptyState title="No promoted fields" description="Promoted fields are not configured for this lead." />}
              </Panel>
            </div>

            <Panel title="Raw Lead Payload">
              <div className="grid gap-4 xl:grid-cols-2">
                <CodeBlock title="Dynamic Data" value={dynamicData} />
                <CodeBlock title="Full Lead Record" value={lead} />
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
      <div className="mt-1 break-words text-sm text-white">{value}</div>
    </div>
  );
}

function KeyValueList({ entries }: { entries: Record<string, unknown> }) {
  const rows = Object.entries(entries);

  return (
    <div className="space-y-3">
      {rows.map(([key, value]) => (
        <div key={key} className="rounded-2xl border border-white/8 bg-white/5 p-3">
          <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{key}</div>
          <div className="mt-1 whitespace-pre-wrap break-words text-sm text-white">{toText(value)}</div>
        </div>
      ))}
    </div>
  );
}

function CodeBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
      <div className="text-sm font-medium text-white">{title}</div>
      <pre className="mt-3 max-h-[28rem] overflow-auto rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-200">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}
