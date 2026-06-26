"use client";

import { Badge } from '@/components/ui/Cards';

const toneMap = {
  new: 'cyan',
  contacted: 'amber',
  qualified: 'emerald',
  proposal: 'slate',
  won: 'emerald',
  lost: 'rose',
  deleted: 'rose'
} as const;

export function LeadStatusBadge({ status }: { status?: string }) {
  const normalized = (status ?? 'new').toLowerCase();
  const tone = toneMap[normalized as keyof typeof toneMap] ?? 'slate';

  return <Badge tone={tone}>{status ?? 'new'}</Badge>;
}
