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
    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-slate-200">
      <div className="animate-pulse text-sm uppercase tracking-[0.3em] text-cyan-200/60">{label}</div>
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

