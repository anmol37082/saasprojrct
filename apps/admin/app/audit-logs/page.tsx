"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { PageShell } from '@/components/ui/PageShell';
import { Badge, Panel } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { listAuditLogs } from '@/services/auditService';
import type { AuditLogsResponse } from '@/types/audit';

const initialFilters = { search: '', action: '', resource: '', severity: '', startDate: '', endDate: '' };

export default function AuditLogsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState<AuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const result = (await listAuditLogs({ ...filters, page, limit: 10 })) as AuditLogsResponse;
        if (mounted) setData(result);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [filters, page]);

  const submitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setError(null);
    setFilters((current) => ({ ...current }));
  };

  return (
    <ProtectedLayout>
      <PageShell eyebrow="Operations" title="Audit Logs" description="Track admin activity with filters and search.">
        <Panel title="Filters">
          <form onSubmit={submitFilters} className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {[
              ['search', 'Search'],
              ['action', 'Action'],
              ['resource', 'Resource'],
              ['severity', 'Severity'],
              ['startDate', 'Start Date'],
              ['endDate', 'End Date']
            ].map(([key, label]) => (
              <label key={key} className="space-y-1 text-sm text-slate-300">
                <span>{label}</span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                  type={key.includes('Date') ? 'date' : 'text'}
                  value={(filters as Record<string, string>)[key]}
                  onChange={(e) => setFilters((current) => ({ ...current, [key]: e.target.value }))}
                />
              </label>
            ))}
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

        {loading ? <LoadingState label="Loading audit logs" /> : null}
        {error ? <ErrorState message={error} retry={() => window.location.reload()} /> : null}

        {data ? (
          <Panel
            title="Log Listing"
            right={<Badge tone="cyan">{data.total.toLocaleString()} events</Badge>}
          >
            {data.items.length ? (
              <div className="space-y-3">
                {data.items.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-white">{item.action}</div>
                        <div className="text-sm text-slate-300">
                          {item.resource} {item.resourceId ? `• ${item.resourceId}` : ''}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                      <Badge tone={item.severity === 'critical' ? 'rose' : item.severity === 'warning' ? 'amber' : 'slate'}>
                        {item.severity ?? 'info'}
                      </Badge>
                    </div>
                    {item.metadata && Object.keys(item.metadata).length ? (
                      <pre className="mt-3 overflow-auto rounded-2xl bg-slate-950/70 p-3 text-xs text-slate-200">
                        {JSON.stringify(item.metadata, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No audit logs found" description="Adjust filters or search again." />
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
                Page {data.page} of {data.totalPages}
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
          </Panel>
        ) : null}
      </PageShell>
    </ProtectedLayout>
  );
}

