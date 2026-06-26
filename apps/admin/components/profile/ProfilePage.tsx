"use client";

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import { PageShell } from '@/components/ui/PageShell';
import { Panel } from '@/components/ui/Cards';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { changePassword, getProfile, getSessions, logoutAllDevices, updateProfile } from '@/services/profileService';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  avatarUrl: z.string().optional().default(''),
  timezone: z.string().min(1),
  language: z.string().min(1)
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your new password')
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const profileDefaults: ProfileForm = {
  displayName: '',
  avatarUrl: '',
  timezone: 'Asia/Calcutta',
  language: 'en'
};

const passwordDefaults: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile
  });

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileDefaults
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: passwordDefaults
  });

  useEffect(() => {
    if (profileQuery.data) {
      profileForm.reset({
        displayName: profileQuery.data.displayName ?? '',
        avatarUrl: profileQuery.data.avatarUrl ?? '',
        timezone: profileQuery.data.timezone ?? 'Asia/Calcutta',
        language: profileQuery.data.language ?? 'en'
      });
    }
  }, [profileForm, profileQuery.data]);

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      toast({ title: 'Profile updated', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      toast({ title: 'Update failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: async () => {
      toast({ title: 'Password changed', tone: 'success' });
      passwordForm.reset(passwordDefaults);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      toast({ title: 'Password update failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const logoutAllMutation = useMutation({
    mutationFn: logoutAllDevices,
    onSuccess: async () => {
      toast({ title: 'Logged out everywhere', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      toast({ title: 'Could not revoke sessions', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  return (
    <ProtectedLayout>
      <PageShell
        eyebrow="Account"
        title="Profile"
        description={`Manage your profile, password, and active sessions for ${user?.email ?? 'your account'}.`}
      >
        {profileQuery.isLoading ? <LoadingState label="Loading profile" /> : null}
        {profileQuery.isError ? (
          <ErrorState
            message={profileQuery.error instanceof Error ? profileQuery.error.message : 'Failed to load profile'}
            retry={() => void profileQuery.refetch()}
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Update Profile">
            <form
              className="space-y-4"
              onSubmit={profileForm.handleSubmit(async (values) => {
                await profileMutation.mutateAsync(values);
              })}
            >
              <Field label="Display Name" error={profileForm.formState.errors.displayName?.message}>
                <input className={inputClass} {...profileForm.register('displayName')} />
              </Field>
              <Field label="Avatar URL">
                <input className={inputClass} {...profileForm.register('avatarUrl')} />
              </Field>
              <Field label="Timezone">
                <input className={inputClass} {...profileForm.register('timezone')} />
              </Field>
              <Field label="Language">
                <input className={inputClass} {...profileForm.register('language')} />
              </Field>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950" type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white"
                  type="button"
                  onClick={() => profileForm.reset(profileDefaults)}
                >
                  Reset
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Change Password">
            <form
              className="space-y-4"
              onSubmit={passwordForm.handleSubmit(async (values) => {
                await passwordMutation.mutateAsync(values);
              })}
            >
              <Field label="Current Password" error={passwordForm.formState.errors.currentPassword?.message}>
                <input className={inputClass} type="password" autoComplete="current-password" {...passwordForm.register('currentPassword')} />
              </Field>
              <Field label="New Password" error={passwordForm.formState.errors.newPassword?.message}>
                <input className={inputClass} type="password" autoComplete="new-password" {...passwordForm.register('newPassword')} />
              </Field>
              <Field label="Confirm Password" error={passwordForm.formState.errors.confirmPassword?.message}>
                <input className={inputClass} type="password" autoComplete="new-password" {...passwordForm.register('confirmPassword')} />
              </Field>
              <button className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950" type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel
            title="Session List"
            right={
              <button
                className="rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 disabled:opacity-60"
                type="button"
                disabled={logoutAllMutation.isPending}
                onClick={() => void logoutAllMutation.mutateAsync()}
              >
                {logoutAllMutation.isPending ? 'Revoking...' : 'Logout All Devices'}
              </button>
            }
          >
            {sessionsQuery.isLoading ? <LoadingState label="Loading sessions" /> : null}
            {sessionsQuery.isError ? (
              <ErrorState
                message={sessionsQuery.error instanceof Error ? sessionsQuery.error.message : 'Failed to load sessions'}
                retry={() => void sessionsQuery.refetch()}
              />
            ) : null}
            {sessionsQuery.data?.items.length ? (
              <div className="space-y-3">
                {sessionsQuery.data.items.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-white/8 bg-white/5 p-4">
                    <div className="text-sm font-medium text-white">{session.userAgent || 'Unknown session'}</div>
                    <div className="mt-1 text-sm text-slate-300">
                      {session.ipAddress || 'unknown IP'} {session.revokedAt ? '- revoked' : '- active'}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Last seen {session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString() : 'unknown'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No sessions found" description="Sessions appear after login and refresh activity." />
            )}
          </Panel>

          <Panel title="Profile Summary">
            <div className="space-y-3 text-sm text-slate-200">
              <Row label="Email" value={profileQuery.data?.email ?? user?.email ?? 'Unknown'} />
              <Row label="Role" value={profileQuery.data?.role ?? user?.role ?? 'Unknown'} />
              <Row label="Tenant" value={profileQuery.data?.tenantId ?? user?.tenantId ?? 'Platform'} />
              <Row label="Display Name" value={profileQuery.data?.displayName ?? 'Not set'} />
              <Row label="Timezone" value={profileQuery.data?.timezone ?? 'Asia/Calcutta'} />
              <Row label="Language" value={profileQuery.data?.language ?? 'en'} />
            </div>
          </Panel>
        </div>
      </PageShell>
    </ProtectedLayout>
  );
}

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500';

function Field({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="block space-y-2 text-sm text-slate-300">
      <span>{label}</span>
      {children}
      {error ? <div className="text-xs text-rose-300">{error}</div> : null}
    </label>
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
