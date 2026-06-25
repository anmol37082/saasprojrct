"use client";

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { PageShell } from '@/components/ui/PageShell';
import { Badge, Panel, StatCard } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { getDashboardSummary } from '@/services/auditService';
import type { DashboardSummary } from '@/types/dashboard';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const summary = (await getDashboardSummary()) as DashboardSummary;
        if (mounted) setData(summary);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ProtectedLayout>
      <PageShell eyebrow="Overview" title="Dashboard" description="Quick read on lead volume, source mix, and recent activity.">
        {loading ? <LoadingState label="Loading dashboard" /> : null}
        {error ? <ErrorState message={error} retry={() => window.location.reload()} /> : null}
        {data ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Leads" value={data.totalLeads.toLocaleString()} hint="all time" />
              <StatCard label="Today's Leads" value={data.todaysLeads.toLocaleString()} hint="since midnight" />
              <StatCard label="Source Domains" value={data.leadsBySource.length.toString()} hint="top sources" />
              <StatCard label="Recent Events" value={data.recentActivity.length.toString()} hint="audit feed" />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Leads by Source">
                {data.leadsBySource.length ? (
                  <div className="space-y-4">
                    {data.leadsBySource.map((item) => {
                      const max = Math.max(...data.leadsBySource.map((entry) => entry.count), 1);
                      const width = `${Math.max((item.count / max) * 100, 6)}%`;
                      return (
                        <div key={item.sourceDomain} className="space-y-2">
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-slate-100">{item.sourceDomain}</span>
                            <span className="text-slate-300">{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/10">
                            <div className="h-2 rounded-full bg-cyan-400" style={{ width }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="No lead sources yet" description="Source analytics will appear once leads are ingested." />
                )}
              </Panel>

              <Panel title="Daily Trend">
                {data.dailyLeads.length ? (
                  <div className="grid grid-cols-7 gap-2">
                    {data.dailyLeads.map((item) => {
                      const max = Math.max(...data.dailyLeads.map((entry) => entry.count), 1);
                      const height = `${Math.max((item.count / max) * 100, 10)}%`;
                      return (
                        <div key={item.date} className="flex flex-col items-center gap-2">
                          <div className="flex h-40 w-full items-end rounded-2xl bg-white/5 p-2">
                            <div className="w-full rounded-xl bg-gradient-to-t from-cyan-500 to-sky-300" style={{ height }} />
                          </div>
                          <div className="text-[10px] text-slate-400">{item.date.slice(5)}</div>
                          <Badge tone="cyan">{item.count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="No trend data available" />
                )}
              </Panel>
            </div>

            <Panel title="Recent Activity">
              {data.recentActivity.length ? (
                <div className="space-y-3">
                  {data.recentActivity.map((activity) => (
                    <div key={activity._id} className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{activity.action}</div>
                        <div className="text-sm text-slate-300">
                          {activity.resource} {activity.resourceId ? `• ${activity.resourceId}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge tone={activity.severity === 'critical' ? 'rose' : activity.severity === 'warning' ? 'amber' : 'slate'}>
                          {activity.severity ?? 'info'}
                        </Badge>
                        <div className="text-xs text-slate-400">{activity.createdAt ? new Date(activity.createdAt).toLocaleString() : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No recent activity" description="Audit events will be listed here." />
              )}
            </Panel>
          </div>
        ) : null}
      </PageShell>
    </ProtectedLayout>
  );
}

