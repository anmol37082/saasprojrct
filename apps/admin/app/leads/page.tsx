"use client";

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { Badge, Panel } from '@/components/ui/Cards';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { PageShell } from '@/components/ui/PageShell';
import { LeadFilters, type LeadFilterState } from '@/components/leads/LeadFilters';
import { LeadMetrics } from '@/components/leads/LeadMetrics';
import { LeadSkeleton } from '@/components/leads/LeadSkeleton';
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge';
import { deleteLead, listLeads } from '@/services/leadService';
import { exportCsv, exportXlsx } from '@/services/exportService';
import type { Lead, LeadStatistics, LeadsListResponse } from '@/types/lead';
import { useToast } from '@/hooks/useToast';

const defaultFilters: LeadFilterState = {
  search: '',
  status: '',
  sourceDomain: '',
  startDate: '',
  endDate: '',
  sortField: 'createdAt',
  sortOrder: 'desc'
};

function buildQueryParams(filters: LeadFilterState, page: number) {
  const params: Record<string, string | number | undefined> = {
    page,
    limit: 10,
    sortField: filters.sortField,
    sortOrder: filters.sortOrder
  };

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.status.trim()) params.status = filters.status.trim();
  if (filters.sourceDomain.trim()) params.sourceDomain = filters.sourceDomain.trim();
  if (filters.startDate.trim()) params.startDate = filters.startDate.trim();
  if (filters.endDate.trim()) params.endDate = filters.endDate.trim();

  return params;
}

function buildExportParams(filters: LeadFilterState) {
  const params: Record<string, string | number | undefined> = {
    sortField: filters.sortField,
    sortOrder: filters.sortOrder
  };

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.status.trim()) params.status = filters.status.trim();
  if (filters.sourceDomain.trim()) params.sourceDomain = filters.sourceDomain.trim();
  if (filters.startDate.trim()) params.startDate = filters.startDate.trim();
  if (filters.endDate.trim()) params.endDate = filters.endDate.trim();

  return params;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

function toText(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toLocaleString();
  return JSON.stringify(value);
}

function getLeadKey(lead: Lead) {
  return lead._id ?? lead.id;
}

function getLeadName(lead: Lead) {
  return toText(lead.name ?? lead.promotedFields?.name ?? lead.dynamicData?.name ?? lead.dynamicData?.fullName ?? 'Unnamed lead');
}

function getLeadContact(lead: Lead) {
  return toText(lead.email ?? lead.promotedFields?.email ?? lead.dynamicData?.email ?? lead.phone ?? lead.promotedFields?.phone ?? lead.dynamicData?.phone ?? '');
}

function getLeadSource(lead: Lead) {
  return toText(lead.sourceDomain ?? lead.metadata?.sourceDomain ?? 'unknown source');
}

function getLeadStatistics(data?: LeadsListResponse | null): LeadStatistics {
  const items = data?.items ?? [];
  const uniqueSources = new Set(
    items
      .map((lead) => lead.sourceDomain ?? lead.metadata?.sourceDomain)
      .filter((value): value is string => Boolean(value && value.trim()))
  ).size;

  return {
    total: data?.total ?? 0,
    active: items.filter((lead) => (lead.status ?? 'new') !== 'deleted').length,
    deleted: items.filter((lead) => (lead.status ?? '') === 'deleted').length,
    sources: uniqueSources
  };
}

export default function LeadsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LeadFilterState>(defaultFilters);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null);

  const queryParams = useMemo(() => buildQueryParams(filters, page), [filters, page]);
  const exportParams = useMemo(() => buildExportParams(filters), [filters]);

  const leadsQuery = useQuery({
    queryKey: ['leads', queryParams],
    queryFn: () => listLeads(queryParams)
  });

  const deleteMutation = useMutation({
    mutationFn: async (lead: Lead) => {
      const leadId = getLeadKey(lead);
      const title = getLeadName(lead);
      if (!window.confirm(`Delete ${title}? This will mark the lead as deleted.`)) {
        return null;
      }

      await deleteLead(leadId);
      return lead;
    },
    onSuccess: async (lead) => {
      if (!lead) return;
      toast({ title: 'Lead deleted', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      toast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const leads = leadsQuery.data?.items ?? [];
  const stats = getLeadStatistics(leadsQuery.data);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(format);
    try {
      const blob = format === 'csv' ? await exportCsv(exportParams) : await exportXlsx(exportParams);
      const suffix = format === 'csv' ? 'csv' : 'xlsx';
      downloadBlob(blob, `leads-export.${suffix}`);
      toast({ title: `Lead export downloaded`, tone: 'success' });
    } catch (error) {
      toast({ title: 'Export failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    } finally {
      setExporting(null);
    }
  };

  return (
    <ProtectedLayout>
      <PageShell
        eyebrow="Management"
        title="Leads"
        description="Search, filter, export, and manage tenant leads with a responsive admin workflow."
        actions={
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-60"
              type="button"
              onClick={() => void leadsQuery.refetch()}
              disabled={leadsQuery.isFetching}
            >
              Refresh
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-60"
              type="button"
              onClick={() => void handleExport('csv')}
              disabled={exporting !== null}
            >
              {exporting === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
            </button>
            <button
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              type="button"
              onClick={() => void handleExport('xlsx')}
              disabled={exporting !== null}
            >
              {exporting === 'xlsx' ? 'Exporting XLSX...' : 'Export XLSX'}
            </button>
          </div>
        }
      >
        <LeadMetrics stats={stats} />

        <Panel title="Filters" right={<Badge tone="slate">{leadsQuery.data?.total ?? 0} total</Badge>}>
          <LeadFilters
            value={filters}
            onChange={(next) => {
              setFilters(next);
              setPage(1);
            }}
            onReset={() => {
              setFilters(defaultFilters);
              setPage(1);
            }}
          />
        </Panel>

        {leadsQuery.isLoading ? <LeadSkeleton /> : null}

        {leadsQuery.isError ? (
          <ErrorState
            message={leadsQuery.error instanceof Error ? leadsQuery.error.message : 'Failed to load leads'}
            retry={() => void leadsQuery.refetch()}
          />
        ) : null}

        {leadsQuery.data ? (
          <Panel
            title="Lead Directory"
            right={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="cyan">Page {leadsQuery.data.currentPage} of {leadsQuery.data.totalPages}</Badge>
                <Badge tone="slate">{leads.length} visible</Badge>
              </div>
            }
          >
            {leads.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {leads.map((lead) => {
                  const leadId = getLeadKey(lead);

                  return (
                    <article key={leadId} className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-950/20">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold text-white">{getLeadName(lead)}</h3>
                            <LeadStatusBadge status={lead.status} />
                            <Badge tone="slate">{getLeadSource(lead)}</Badge>
                          </div>

                          <div className="text-sm text-slate-300">{getLeadContact(lead) || 'No contact details available'}</div>

                          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            <InfoCard label="Lead ID" value={leadId} />
                            <InfoCard label="Created" value={lead.createdAt ? new Date(lead.createdAt).toLocaleString() : 'N/A'} />
                            <InfoCard label="Updated" value={lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : 'N/A'} />
                            <InfoCard label="Source" value={getLeadSource(lead)} />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white" href={`/leads/${encodeURIComponent(leadId)}` as never}>
                            View
                          </Link>
                          <button
                            className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 disabled:opacity-60"
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() => void deleteMutation.mutateAsync(lead)}
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
              <EmptyState title="No leads found" description="Try a different search or reset the filters." />
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
                Page {leadsQuery.data.currentPage} of {leadsQuery.data.totalPages}
              </div>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white disabled:opacity-40"
                type="button"
                disabled={page >= leadsQuery.data.totalPages}
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-3">
      <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm text-white">{value}</div>
    </div>
  );
}
