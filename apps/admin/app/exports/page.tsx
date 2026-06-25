"use client";

import { useState } from 'react';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { PageShell } from '@/components/ui/PageShell';
import { Panel } from '@/components/ui/Cards';
import { downloadBlob } from '@/lib/download';
import { exportCsv, exportXlsx } from '@/services/exportService';
import { useToast } from '@/hooks/useToast';

const initialFilters = { startDate: '', endDate: '', status: '', search: '' };

export default function ExportsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState<'csv' | 'xlsx' | null>(null);

  const download = async (kind: 'csv' | 'xlsx') => {
    setLoading(kind);
    try {
      const blob = kind === 'csv' ? await exportCsv(filters) : await exportXlsx(filters);
      const extension = kind === 'csv' ? 'csv' : 'xlsx';
      downloadBlob(blob, `leads-export.${extension}`);
      toast({ title: `${kind.toUpperCase()} export started`, tone: 'success' });
    } catch (err) {
      toast({ title: 'Export failed', description: err instanceof Error ? err.message : 'Unknown error', tone: 'error' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <ProtectedLayout>
      <PageShell eyebrow="Exports" title="Export UI" description="Download filtered leads as CSV or XLSX.">
        <Panel title="Filters">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['startDate', 'Start Date', 'date'],
              ['endDate', 'End Date', 'date'],
              ['status', 'Status', 'text'],
              ['search', 'Search', 'text']
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
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
              type="button"
              onClick={() => void download('csv')}
              disabled={loading !== null}
            >
              {loading === 'csv' ? 'Preparing CSV...' : 'Export CSV'}
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white disabled:opacity-60"
              type="button"
              onClick={() => void download('xlsx')}
              disabled={loading !== null}
            >
              {loading === 'xlsx' ? 'Preparing XLSX...' : 'Export XLSX'}
            </button>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
              type="button"
              onClick={() => setFilters(initialFilters)}
            >
              Reset Filters
            </button>
          </div>
        </Panel>
      </PageShell>
    </ProtectedLayout>
  );
}

