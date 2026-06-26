"use client";

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { PageShell } from '@/components/ui/PageShell';
import { Badge, Panel } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotificationPreferences
} from '@/services/notificationService';
import { useToast } from '@/hooks/useToast';
import type { NotificationPreferencesInput } from '@/types/notification';

const preferencesSchema = z.object({
  notificationPreferences: z.record(z.string(), z.any()).default({}),
  emailPreferences: z.record(z.string(), z.any()).default({}),
  pushPreferences: z.record(z.string(), z.any()).default({})
});

type PreferencesForm = z.infer<typeof preferencesSchema>;

const defaults: PreferencesForm = {
  notificationPreferences: {
    productUpdates: true,
    leadAlerts: true,
    securityAlerts: true
  },
  emailPreferences: {
    digest: true,
    mentionAlerts: true
  },
  pushPreferences: {
    enabled: true
  }
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => listNotifications({ limit: 50 })
  });

  const form = useForm<PreferencesForm>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: defaults
  });

  useEffect(() => {
    if (notificationsQuery.data) {
      form.reset(defaults);
    }
  }, [form, notificationsQuery.data]);

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Notification deleted', tone: 'success' });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'All notifications marked read', tone: 'success' });
    }
  });

  const preferencesMutation = useMutation({
    mutationFn: saveNotificationPreferences,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Notification preferences saved', tone: 'success' });
    }
  });

  return (
    <ProtectedLayout>
      <PageShell
        eyebrow="Activity"
        title="Notification Center"
        description="Monitor alerts, manage read state, and update notification preferences."
        actions={
          <button
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
            type="button"
            onClick={() => void readAllMutation.mutateAsync()}
            disabled={readAllMutation.isPending}
          >
            {readAllMutation.isPending ? 'Updating...' : 'Mark All Read'}
          </button>
        }
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Notification Preferences">
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(async (values) => {
                await preferencesMutation.mutateAsync(values as NotificationPreferencesInput);
              })}
            >
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <span>Product Updates</span>
                <input type="checkbox" className="h-4 w-4 accent-cyan-400" {...form.register('notificationPreferences.productUpdates')} />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <span>Lead Alerts</span>
                <input type="checkbox" className="h-4 w-4 accent-cyan-400" {...form.register('notificationPreferences.leadAlerts')} />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <span>Security Alerts</span>
                <input type="checkbox" className="h-4 w-4 accent-cyan-400" {...form.register('notificationPreferences.securityAlerts')} />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <span>Email Digest</span>
                <input type="checkbox" className="h-4 w-4 accent-cyan-400" {...form.register('emailPreferences.digest')} />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <span>Email Mention Alerts</span>
                <input type="checkbox" className="h-4 w-4 accent-cyan-400" {...form.register('emailPreferences.mentionAlerts')} />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <span>Push Notifications</span>
                <input type="checkbox" className="h-4 w-4 accent-cyan-400" {...form.register('pushPreferences.enabled')} />
              </label>
              <button className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950" type="submit" disabled={preferencesMutation.isPending}>
                {preferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </Panel>

          <Panel title="Unread Count" right={notificationsQuery.data ? <Badge tone="cyan">{notificationsQuery.data.unreadCount} unread</Badge> : null}>
            {notificationsQuery.isLoading ? <LoadingState label="Loading notifications" /> : null}
            {notificationsQuery.isError ? (
              <ErrorState
                message={notificationsQuery.error instanceof Error ? notificationsQuery.error.message : 'Failed to load notifications'}
                retry={() => void notificationsQuery.refetch()}
              />
            ) : null}
            {notificationsQuery.data?.items.length ? (
              <div className="space-y-3">
                {notificationsQuery.data.items.map((item) => (
                  <div key={item._id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-medium text-white">{item.title}</div>
                          <Badge tone={item.readAt ? 'slate' : item.severity === 'critical' ? 'rose' : 'cyan'}>
                            {item.readAt ? 'read' : 'unread'}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-300">{item.body}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white"
                          type="button"
                          onClick={() => void readMutation.mutateAsync(item._id)}
                          disabled={item.readAt !== null || readMutation.isPending}
                        >
                          Mark Read
                        </button>
                        <button
                          className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-100"
                          type="button"
                          onClick={() => void deleteMutation.mutateAsync(item._id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No notifications yet" description="System, lead, and security alerts will show here." />
            )}
          </Panel>
        </div>
      </PageShell>
    </ProtectedLayout>
  );
}
