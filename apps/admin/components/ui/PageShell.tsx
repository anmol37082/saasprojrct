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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          {eyebrow ? <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{eyebrow}</div> : null}
          <div className="text-3xl font-semibold text-white">{title}</div>
          {description ? <p className="max-w-2xl text-sm leading-6 text-slate-300">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
