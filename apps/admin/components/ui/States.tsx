"use client";

import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center">
      <div className="text-lg font-semibold text-white">{title}</div>
      {description ? <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-slate-200">
      <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-cyan-200/60">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
        {label}
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-5/6 animate-pulse rounded-full bg-white/10" />
        <div className="grid gap-3 pt-2 md:grid-cols-2">
          <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  retry
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-6 py-10 text-center">
      <div className="text-lg font-semibold text-rose-100">Something went wrong</div>
      <p className="mt-2 text-sm text-rose-100/80">{message}</p>
      {retry ? (
        <button
          className="mt-4 rounded-full border border-rose-300/30 bg-rose-400/15 px-4 py-2 text-sm text-rose-50"
          onClick={retry}
          type="button"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
