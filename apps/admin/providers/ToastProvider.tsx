"use client";

import { useEffect, useMemo, useState } from 'react';
import { ToastContext, type ToastInput, type ToastTone } from '../context/ToastContext';

type ToastItem = ToastInput & { id: string };

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = (input: ToastInput) => {
    const id = crypto.randomUUID();
    const item = { id, tone: input.tone ?? 'info', title: input.title, description: input.description };
    setToasts((current) => [...current, item]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
    }, 3600);
  };

  const value = useMemo(() => ({ toast }), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const toneClasses: Record<ToastTone, string> = {
    success: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-50',
    error: 'border-rose-400/30 bg-rose-500/15 text-rose-50',
    info: 'border-cyan-400/30 bg-cyan-500/15 text-cyan-50'
  };

  return (
    <div className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur ${toneClasses[item.tone ?? 'info']}`}>
      <div className="text-sm font-semibold">{item.title}</div>
      {item.description ? <div className="mt-1 text-sm opacity-90">{item.description}</div> : null}
    </div>
  );
}

