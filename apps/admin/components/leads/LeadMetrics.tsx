"use client";

import { StatCard } from '@/components/ui/Cards';
import type { LeadStatistics } from '@/types/lead';

export function LeadMetrics({ stats }: { stats: LeadStatistics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Leads" value={stats.total.toLocaleString()} hint="matches current filters" />
      <StatCard label="Active Leads" value={stats.active.toLocaleString()} hint="visible on the current page" />
      <StatCard label="Deleted Leads" value={stats.deleted.toLocaleString()} hint="visible on the current page" />
      <StatCard label="Unique Sources" value={stats.sources.toLocaleString()} hint="visible on the current page" />
    </div>
  );
}
