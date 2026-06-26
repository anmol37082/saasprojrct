"use client";

import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-sm">
      <div className="text-sm text-slate-300">{label}</div>
      <div className="mt-2 font-display text-3xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-2 text-[11px] uppercase tracking-[0.24em] text-cyan-200/60">{hint}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  children,
  right
}: {
  title: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'cyan' | 'amber' | 'rose' | 'emerald' }) {
  const tones = {
    slate: 'bg-white/10 text-slate-100',
    cyan: 'bg-cyan-400/15 text-cyan-100',
    amber: 'bg-amber-400/15 text-amber-100',
    rose: 'bg-rose-400/15 text-rose-100',
    emerald: 'bg-emerald-400/15 text-emerald-100'
  } as const;

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
