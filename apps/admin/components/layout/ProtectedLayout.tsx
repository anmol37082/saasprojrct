"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

type ProtectedLayoutProps = {
  children?: ReactNode;
};

const PROTECTED_PREFIXES = ['/dashboard', '/clients', '/leads', '/exports', '/audit-logs', '/settings'];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, isAuthenticated } = useAuth();

  const protectedRoute = isProtectedPath(pathname ?? '');

  useEffect(() => {
    if (!protectedRoute) return;
    if (loading) return;
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, loading, protectedRoute, router]);

  if (protectedRoute && loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>
    );
  }

  if (protectedRoute && !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_32%),linear-gradient(180deg,_#0b1020_0%,_#0f172a_100%)] text-slate-50">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 py-4">
        <Sidebar />
        <main className="w-full min-w-0 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}





