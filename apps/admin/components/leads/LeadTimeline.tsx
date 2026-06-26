"use client";

import { Badge } from '@/components/ui/Cards';
import type { AuditLog } from '@/types/audit';

function severityTone(severity?: string) {
  if (severity === 'critical') return 'rose';
  if (severity === 'warning') return 'amber';
  return 'slate';
}

export function LeadTimeline({ items }: { items: AuditLog[] }) {
  if (!items.length) {
    return <div className="text-sm text-slate-400">No timeline entries yet.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item._id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium text-white">{item.action}</div>
              <div className="text-xs text-slate-400">
                {item.resource}
                {item.resourceId ? ` - ${item.resourceId}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={severityTone(item.severity)}>{item.severity ?? 'info'}</Badge>
              <div className="text-xs text-slate-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
