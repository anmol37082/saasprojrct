"use client";

import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const { user, logout, loading, refreshToken } = useAuth();

  return (
    <header className="border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/60">Multi-tenant lead SaaS</div>
          <div className="font-display text-base font-semibold text-white">Admin Panel</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="font-medium text-white">{user?.displayName ?? user?.email ?? 'Not signed in'}</div>
            <div className="text-xs text-slate-300/70">{user?.role ?? 'guest'}</div>
          </div>
          <button
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
            type="button"
            onClick={() => void logout(refreshToken)}
            disabled={loading}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}


