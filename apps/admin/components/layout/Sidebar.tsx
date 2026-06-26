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
    { href: '/notifications', label: 'Notifications' },
    { href: '/profile', label: 'Profile' },
    { href: '/settings', label: 'Settings' },
    { href: '/maintenance', label: 'Maintenance' }
  ];

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-4 rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-4 shadow-xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-200/70">SaaS Admin</div>
          <div className="font-display mt-1 text-lg font-semibold text-white">Operations Console</div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className={[
                  'block rounded-2xl px-3 py-2.5 text-sm font-medium tracking-[-0.01em] transition',
                  active
                    ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-200 hover:bg-white/8 hover:text-white'
                ].join(' ')}
                href={item.href as never}
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



