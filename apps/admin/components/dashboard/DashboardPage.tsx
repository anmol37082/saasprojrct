"use client";

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { Badge, Panel, StatCard } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { PageShell } from '@/components/ui/PageShell';
import { getDashboardSummary } from '@/services/dashboardService';
import type { DashboardSummary } from '@/types/dashboard';

type DashboardFilters = {
  search: string;
  startDate: string;
  endDate: string;
};

const initialFilters: DashboardFilters = {
  search: '',
  startDate: '',
  endDate: ''
};

const chartColors = ['#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#f472b6'];

export default function DashboardPage() {
  const [draftFilters, setDraftFilters] = useState<DashboardFilters>(initialFilters);
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);

  const queryParams = useMemo(
    () => ({
      search: filters.search.trim() || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    }),
    [filters]
  );

  const dashboardQuery = useQuery({
    queryKey: ['dashboard-summary', queryParams],
    queryFn: () => getDashboardSummary(queryParams)
  });

  return (
    <ProtectedLayout>
      <PageShell
        eyebrow="Overview"
        title="Dashboard"
        description="Lead volume, client health, source mix, and operational activity in one responsive view."
      >
        <Panel title="Filters">
        <form
          className="grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters(draftFilters);
          }}
        >
          <label className="space-y-1 text-sm text-slate-300">
            <span>Search</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500"
              placeholder="Client, source, lead, or status"
              value={draftFilters.search}
              onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            <span>Start Date</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none"
              type="date"
              value={draftFilters.startDate}
              onChange={(event) => setDraftFilters((current) => ({ ...current, startDate: event.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-300">
            <span>End Date</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none"
              type="date"
              value={draftFilters.endDate}
              onChange={(event) => setDraftFilters((current) => ({ ...current, endDate: event.target.value }))}
            />
          </label>
          <div className="md:col-span-3 flex flex-wrap gap-3">
            <button className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" type="submit">
              Apply Filters
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
              type="button"
              onClick={() => {
                setDraftFilters(initialFilters);
                setFilters(initialFilters);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </Panel>

        {dashboardQuery.isLoading ? <LoadingState label="Loading dashboard" /> : null}
        {dashboardQuery.isError ? (
          <ErrorState
            message={dashboardQuery.error instanceof Error ? dashboardQuery.error.message : 'Failed to load dashboard'}
            retry={() => void dashboardQuery.refetch()}
          />
        ) : null}

        {dashboardQuery.data ? <DashboardContent data={dashboardQuery.data} /> : null}
      </PageShell>
    </ProtectedLayout>
  );
}

function DashboardContent({ data }: { data: DashboardSummary }) {
  const sourceSeries = data.topSources.slice(0, 6);
  const maxSource = Math.max(...sourceSeries.map((item) => item.count), 1);
  const maxLine = Math.max(...data.lineChart.map((item) => item.count), 1);
  const maxArea = Math.max(...data.areaChart.map((item) => Math.max(item.count, item.won)), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Clients" value={data.totalClients.toLocaleString()} hint="all accounts" />
        <StatCard label="Active Clients" value={data.activeClients.toLocaleString()} hint="enabled now" />
        <StatCard label="Inactive Clients" value={data.inactiveClients.toLocaleString()} hint="paused or disabled" />
        <StatCard label="Conversion Rate" value={`${data.conversionRate.toFixed(1)}%`} hint="won leads / total leads" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Leads" value={data.totalLeads.toLocaleString()} hint="all time" />
        <StatCard label="Today's Leads" value={data.todaysLeads.toLocaleString()} hint="since midnight" />
        <StatCard label="Weekly Leads" value={data.weeklyLeads.toLocaleString()} hint="last 7 days" />
        <StatCard label="Monthly Leads" value={data.monthlyLeads.toLocaleString()} hint="last 30 days" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Top Sources">
          {sourceSeries.length ? (
            <div className="space-y-4">
              {sourceSeries.map((item, index) => {
                const width = `${Math.max((item.count / maxSource) * 100, 8)}%`;
                return (
                  <div key={item.sourceDomain} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-slate-100">{item.sourceDomain}</span>
                      <span className="text-slate-300">
                        {item.count.toLocaleString()} <span className="text-slate-500">({item.share.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full" style={{ width, background: chartColors[index % chartColors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No source data" description="Source analytics appear once leads are ingested." />
          )}
        </Panel>

        <Panel title="Recent Activity">
          {data.recentActivity.length ? (
            <div className="space-y-3">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity._id}
                  className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-white">{activity.action}</div>
                    <div className="text-sm text-slate-300">
                      {activity.resource} {activity.resourceId ? `- ${activity.resourceId}` : ''}
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
            <EmptyState title="No recent activity" description="Audit events will appear here." />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Weekly Line Chart">
          {data.lineChart.length ? <LineChart data={data.lineChart} maxValue={maxLine} /> : <EmptyState title="No weekly data available" />}
        </Panel>

        <Panel title="Area Chart">
          {data.areaChart.length ? <AreaChart data={data.areaChart} maxValue={maxArea} /> : <EmptyState title="No area data available" />}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Bar Chart">{data.barChart.length ? <BarChart data={data.barChart} /> : <EmptyState title="No bar chart data" />}</Panel>
        <Panel title="Pie Chart">{data.pieChart.length ? <PieChart data={data.pieChart} /> : <EmptyState title="No pie chart data" />}</Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Recent Clients">
          {data.recentClients.length ? (
            <div className="space-y-3">
              {data.recentClients.map((client) => (
                <div key={client._id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-white">{client.clientName ?? client.clientId ?? client._id}</div>
                    <Badge tone={client.active ? 'emerald' : 'rose'}>{client.active ? 'active' : 'inactive'}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-slate-300">{client.clientId ?? client._id}</div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent clients" />
          )}
        </Panel>

        <Panel title="Recent Leads">
          {data.recentLeads.length ? (
            <div className="space-y-3">
              {data.recentLeads.map((lead) => (
                <div key={lead._id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-white">{lead.name ?? lead.email ?? lead._id}</div>
                    <Badge tone="cyan">{lead.status ?? 'new'}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-slate-300">
                    {lead.sourceDomain ?? 'unknown source'} {lead.email ? `- ${lead.email}` : ''}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent leads" />
          )}
        </Panel>
      </div>
    </div>
  );
}

function LineChart({ data, maxValue }: { data: DashboardSummary['lineChart']; maxValue: number }) {
  const width = 560;
  const height = 180;
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : (index / Math.max(data.length - 1, 1)) * width;
    const y = height - (item.count / Math.max(maxValue, 1)) * (height - 24) - 12;
    return `${x},${y}`;
  });

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full">
        <defs>
          <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points.join(' ')} />
        <polygon fill="url(#lineFill)" points={`${points.join(' ')} ${width},${height} 0,${height}`} />
      </svg>
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-slate-400">
        {data.map((item) => (
          <div key={item.date}>{item.date.slice(5)}</div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }: { data: DashboardSummary['barChart'] }) {
  const maxValue = Math.max(...data.map((item) => Math.max(item.count, item.won)), 1);
  return (
    <div className="grid grid-cols-7 gap-2">
      {data.map((item, index) => {
        const countHeight = `${Math.max((item.count / maxValue) * 100, 8)}%`;
        const wonHeight = `${Math.max((item.won / maxValue) * 100, 8)}%`;
        return (
          <div key={item.date} className="space-y-2 text-center">
            <div className="flex h-44 items-end gap-1 rounded-2xl bg-white/5 p-2">
              <div className="w-1/2 rounded-xl" style={{ height: countHeight, background: chartColors[index % chartColors.length] }} />
              <div className="w-1/2 rounded-xl bg-emerald-400/70" style={{ height: wonHeight }} />
            </div>
            <div className="text-[10px] text-slate-400">{item.date.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}

function AreaChart({ data, maxValue }: { data: DashboardSummary['areaChart']; maxValue: number }) {
  const width = 560;
  const height = 180;
  const points = data.map((item, index) => {
    const x = data.length === 1 ? width / 2 : (index / Math.max(data.length - 1, 1)) * width;
    const y = height - (item.count / Math.max(maxValue, 1)) * (height - 24) - 12;
    return `${x},${y}`;
  });
  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-52 w-full">
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points.join(' ')} />
        <polygon fill="url(#areaFill)" points={`${points.join(' ')} ${width},${height} 0,${height}`} />
      </svg>
      <div className="grid grid-cols-6 gap-2 text-center text-[10px] text-slate-400">
        {data.slice(-6).map((item) => (
          <div key={item.date}>{item.date.slice(5)}</div>
        ))}
      </div>
    </div>
  );
}

function PieChart({ data }: { data: DashboardSummary['pieChart'] }) {
  const total = Math.max(data.reduce((sum, item) => sum + item.value, 0), 1);
  let offset = 0;
  const radius = 64;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-center">
      <svg viewBox="0 0 180 180" className="mx-auto h-56 w-56">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        {data.slice(0, 6).map((item, index) => {
          const length = (item.value / total) * circumference;
          const dashArray = `${length} ${circumference - length}`;
          const node = (
            <circle
              key={item.label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={chartColors[index % chartColors.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
              strokeDashoffset={-offset}
              transform="rotate(-90 90 90)"
              strokeLinecap="round"
            />
          );
          offset += length;
          return node;
        })}
      </svg>
      <div className="space-y-2">
        {data.slice(0, 6).map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ background: chartColors[index % chartColors.length] }} />
              <span className="text-sm text-white">{item.label}</span>
            </div>
            <span className="text-sm text-slate-300">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
