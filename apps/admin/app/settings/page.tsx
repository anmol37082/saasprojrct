"use client";

import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { PageShell } from '@/components/ui/PageShell';
import { Panel } from '@/components/ui/Cards';
import { useAuth } from '../../hooks/useAuth';

export default function SettingsPage() {
  const { user, refreshToken, token, logout } = useAuth();

  return (
    <ProtectedLayout>
      <PageShell eyebrow="System" title="Settings" description="Session info, deployment checklist, and environment pointers.">
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Session">
            <div className="space-y-3 text-sm text-slate-200">
              <Row label="Email" value={user?.email ?? 'Unknown'} />
              <Row label="Role" value={user?.role ?? 'Unknown'} />
              <Row label="Tenant" value={user?.tenantId ?? 'Platform'} />
              <Row label="Access token" value={token ? 'Stored in browser' : 'Missing'} />
              <Row label="Refresh token" value={refreshToken ? 'Stored in browser' : 'Missing'} />
            </div>
            <button className="mt-4 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" type="button" onClick={() => void logout()}>
              Logout
            </button>
          </Panel>

          <Panel title="Deployment Checklist">
            <ul className="space-y-3 text-sm text-slate-200">
              <ChecklistItem text="Set NEXT_PUBLIC_API_BASE_URL to the backend Vercel URL." />
              <ChecklistItem text="Configure MONGODB_URI and MONGODB_DB_NAME on backend deployment." />
              <ChecklistItem text="Add JWT_ACCESS_SECRET and JWT_REFRESH_SECRET securely." />
              <ChecklistItem text="Enable CORS origins for the admin frontend domain." />
              <ChecklistItem text="Attach custom domain in Vercel after both deployments are live." />
            </ul>
          </Panel>
        </div>
      </PageShell>
    </ProtectedLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return <li className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">{text}</li>;
}

