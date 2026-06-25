"use client";

import { useEffect, useMemo, useState } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { PageShell } from '@/components/ui/PageShell';
import { Badge, Panel } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { deleteManagedLead, getManagedLead, listManagedLeads } from '@/services/leadService';
import type { Lead, LeadsListResponse } from '@/types/lead';
import { useToast } from '@/hooks/useToast';

const initialFilters = { search: '', status: '', sourceDomain: '', startDate: '', endDate: '', sortField: 'createdAt', sortOrder: 'desc' };

function stringValue(value: unknown) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export default function LeadsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState<LeadsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const params = useMemo(() => ({ ...filters, page, limit: 10 }), [filters, page]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const result = (await listManagedLeads(params)) as LeadsListResponse;
        if (mounted) setData(result);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load leads');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params]);

  const submitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setError(null);
  };

  const openLead = async (leadId: string) => {
    setDetailLoading(true);
    try {
      const lead = await getManagedLead(leadId);
      setSelectedLead(lead);
    } catch (err) {
      toast({ title: 'Unable to load lead', description: err instanceof Error ? err.message : 'Unknown error', tone: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const onDelete = async (leadId: string) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await deleteManagedLead(leadId);
      toast({ title: 'Lead deleted', tone: 'success' });
      setSelectedLead(null);
      setPage(1);
    } catch (err) {
      toast({ title: 'Delete failed', description: err instanceof Error ? err.message : 'Unknown error', tone: 'error' });
    }
  };

  return (
    <ProtectedLayout>
      <PageShell eyebrow="Management" title="Leads" description="Search, filter, inspect, and remove tenant leads.">
        <Panel title="Filters">
          <form onSubmit={submitFilters} className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {[
              ['search', 'Search', 'text'],
              ['status', 'Status', 'text'],
              ['sourceDomain', 'Source Domain', 'text'],
              ['startDate', 'Start Date', 'date'],
              ['endDate', 'End Date', 'date']
            ].map(([key, label, type]) => (
              <label key={key} className="space-y-1 text-sm text-slate-300">
                <span>{label}</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                  type={type}
                  value={(filters as Record<string, string>)[key]}
                  onChange={(e) => setFilters((current) => ({ ...current, [key]: e.target.value }))}
                />
              </label>
            ))}
            <div className="space-y-1 text-sm text-slate-300">
              <span>Sort</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
                value={`${filters.sortField}:${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortField, sortOrder] = e.target.value.split(':');
                  setFilters((current) => ({ ...current, sortField, sortOrder }));
                }}
              >
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
              </select>
            </div>
            <div className="flex items-end gap-3 md:col-span-2 xl:col-span-6">
              <button className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" type="submit">
                Apply Filters
              </button>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
                type="button"
                onClick={() => {
                  setFilters(initialFilters);
                  setPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </form>
        </Panel>

        {loading ? <LoadingState label="Loading leads" /> : null}
        {error ? <ErrorState message={error} retry={() => window.location.reload()} /> : null}

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Panel title="Leads Table" right={data ? <Badge tone="cyan">{data.total.toLocaleString()} results</Badge> : null}>
            {data?.items.length ? (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Lead</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((lead) => (
                      <tr key={lead._id ?? lead.id} className="border-t border-white/8 text-slate-100 hover:bg-white/5">
                        <td className="px-4 py-3">
                          <div className="font-medium">{stringValue(lead.name ?? lead.promotedFields?.name ?? 'Unnamed lead')}</div>
                          <div className="text-xs text-slate-400">{stringValue(lead.email ?? lead.promotedFields?.email ?? lead.phone ?? '')}</div>
                        </td>
                        <td className="px-4 py-3">{lead.sourceDomain ?? 'unknown'}</td>
                        <td className="px-4 py-3">
                          <Badge tone={lead.status === 'deleted' ? 'rose' : 'cyan'}>{lead.status ?? 'new'}</Badge>
                        </td>
                        <td className="px-4 py-3">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                              type="button"
                              onClick={() => void openLead(lead._id ?? lead.id)}
                              disabled={detailLoading}
                            >
                              View
                            </button>
                            <button
                              className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100"
                              type="button"
                              onClick={() => void onDelete(lead._id ?? lead.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No leads found" description="Try a different search or reset filters." />
            )}
            {data ? (
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
                  Page {data.currentPage} of {data.totalPages}
                </div>
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white disabled:opacity-40"
                  type="button"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </Panel>

          <Panel title="Lead Details">
            {selectedLead ? (
              <div className="space-y-4">
                <div>
                  <div className="text-lg font-semibold text-white">{stringValue(selectedLead.name ?? selectedLead.promotedFields?.name ?? 'Unnamed lead')}</div>
                  <div className="text-sm text-slate-300">{stringValue(selectedLead.email ?? selectedLead.promotedFields?.email ?? 'No email')}</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Phone" value={stringValue(selectedLead.phone ?? selectedLead.promotedFields?.phone ?? 'N/A')} />
                  <Field label="Source" value={stringValue(selectedLead.sourceDomain ?? 'unknown')} />
                  <Field label="Status" value={stringValue(selectedLead.status ?? 'new')} />
                  <Field label="Created" value={selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleString() : 'N/A'} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-white">Dynamic Data</div>
                  <pre className="overflow-auto rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-200">
                    {JSON.stringify(selectedLead.dynamicData ?? selectedLead, null, 2)}
                  </pre>
                </div>
                <button
                  className="rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100"
                  type="button"
                  onClick={() => void onDelete(selectedLead._id ?? selectedLead.id)}
                >
                  Delete Lead
                </button>
              </div>
            ) : (
              <EmptyState title="Select a lead" description="Lead details appear here after you click View." />
            )}
          </Panel>
        </div>
      </PageShell>
    </ProtectedLayout>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
      <div className="text-[11px] uppercase tracking-[0.25em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm text-white">{value}</div>
    </div>
  );
}

