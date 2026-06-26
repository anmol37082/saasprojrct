"use client";

import type { ReactNode } from 'react';

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 border-b border-white/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          {eyebrow ? <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">{eyebrow}</div> : null}
          <div className="font-display text-3xl font-semibold text-white sm:text-4xl">{title}</div>
          {description ? <p className="max-w-2xl text-sm leading-7 text-slate-300">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
