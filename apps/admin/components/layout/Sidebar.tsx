"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/clients', label: 'Clients' },
    { href: '/leads', label: 'Leads' },
    { href: '/exports', label: 'Exports' },
    { href: '/audit-logs', label: 'Audit Logs' },
    { href: '/settings', label: 'Settings' }
  ];

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-4 rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-xl shadow-slate-950/30 backdrop-blur">
        <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">SaaS Admin</div>
          <div className="mt-1 text-lg font-semibold text-white">Operations Console</div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className={[
                  'block rounded-2xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-200 hover:bg-white/8 hover:text-white'
                ].join(' ')}
                href={item.href as any}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}



