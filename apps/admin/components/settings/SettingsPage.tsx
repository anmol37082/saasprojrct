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
import { ErrorState, LoadingState } from '@/components/ui/States';
import { getSettings, saveSettings } from '@/services/settingsService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import type { SettingsShape } from '@/types/settings';

const schema = z.object({
  general: z.object({
    companyName: z.string().min(2, 'Company name is required'),
    timezone: z.string().min(1),
    language: z.string().min(1)
  }),
  company: z.object({
    legalName: z.string().optional().default(''),
    website: z.string().url().or(z.literal('')).optional().default(''),
    supportEmail: z.string().email().or(z.literal('')).optional().default('')
  }),
  brand: z.object({
    primaryColor: z.string().min(1),
    logoUrl: z.string().optional().default(''),
    faviconUrl: z.string().optional().default('')
  }),
  theme: z.object({
    mode: z.enum(['dark', 'light', 'system']).or(z.string()),
    density: z.enum(['comfortable', 'compact']).or(z.string())
  }),
  integrations: z.object({
    apiBaseUrl: z.string().optional().default(''),
    webhookUrl: z.string().optional().default('')
  }),
  security: z.object({
    sessionTimeoutMinutes: z.coerce.number().min(5).max(1440),
    passwordMinLength: z.coerce.number().min(8).max(64)
  }),
  audit: z.object({
    retentionDays: z.coerce.number().min(7).max(3650)
  }),
  backup: z.object({
    enabled: z.boolean(),
    frequency: z.string().min(1)
  }),
  webhook: z.object({
    enabled: z.boolean(),
    endpoint: z.string().optional().default('')
  }),
  smtp: z.object({
    host: z.string().optional().default(''),
    port: z.coerce.number().min(1).max(65535),
    username: z.string().optional().default(''),
    fromEmail: z.string().email().or(z.literal('')).optional().default('')
  }),
  email: z.object({
    fromName: z.string().optional().default(''),
    replyTo: z.string().email().or(z.literal('')).optional().default('')
  })
});

type SettingsForm = z.infer<typeof schema>;

const defaults: SettingsForm = {
  general: { companyName: 'SaaS Admin', timezone: 'Asia/Calcutta', language: 'en' },
  company: { legalName: '', website: '', supportEmail: '' },
  brand: { primaryColor: '#22d3ee', logoUrl: '', faviconUrl: '' },
  theme: { mode: 'dark', density: 'comfortable' },
  integrations: { apiBaseUrl: '', webhookUrl: '' },
  security: { sessionTimeoutMinutes: 60, passwordMinLength: 12 },
  audit: { retentionDays: 90 },
  backup: { enabled: true, frequency: 'daily' },
  webhook: { enabled: false, endpoint: '' },
  smtp: { host: '', port: 587, username: '', fromEmail: '' },
  email: { fromName: 'SaaS Admin', replyTo: '' }
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(schema),
    defaultValues: defaults
  });

  useEffect(() => {
    if (settingsQuery.data) {
      form.reset(normalizeSettings(settingsQuery.data));
    }
  }, [form, settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: async () => {
      toast({ title: 'Settings saved', tone: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error) => {
      toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Unknown error', tone: 'error' });
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await saveMutation.mutateAsync(values);
  });

  return (
    <ProtectedLayout>
      <PageShell
        eyebrow="System"
        title="Settings"
        description={`Configured workspace settings for ${user?.email ?? 'the current admin'}.`}
      >
        {settingsQuery.isLoading ? <LoadingState label="Loading settings" /> : null}
        {settingsQuery.isError ? (
          <ErrorState
            message={settingsQuery.error instanceof Error ? settingsQuery.error.message : 'Failed to load settings'}
            retry={() => void settingsQuery.refetch()}
          />
        ) : null}

        {settingsQuery.data ? (
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="General Settings">
                <SectionGrid>
                  <TextField label="Company Name" error={form.formState.errors.general?.companyName?.message}>
                    <input className={inputClass} {...form.register('general.companyName')} />
                  </TextField>
                  <TextField label="Timezone">
                    <input className={inputClass} {...form.register('general.timezone')} />
                  </TextField>
                  <TextField label="Language">
                    <input className={inputClass} {...form.register('general.language')} />
                  </TextField>
                </SectionGrid>
              </Panel>

              <Panel title="Company Settings">
                <SectionGrid>
                  <TextField label="Legal Name">
                    <input className={inputClass} {...form.register('company.legalName')} />
                  </TextField>
                  <TextField label="Website">
                    <input className={inputClass} {...form.register('company.website')} />
                  </TextField>
                  <TextField label="Support Email">
                    <input className={inputClass} {...form.register('company.supportEmail')} />
                  </TextField>
                </SectionGrid>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Brand Settings">
                <SectionGrid>
                  <TextField label="Primary Color">
                    <input className={inputClass} {...form.register('brand.primaryColor')} />
                  </TextField>
                  <TextField label="Logo Upload">
                    <FileField
                      accept="image/*"
                      value={form.watch('brand.logoUrl')}
                      onChange={async (file) => {
                        const value = await readFileAsDataUrl(file);
                        form.setValue('brand.logoUrl', value, { shouldDirty: true, shouldValidate: true });
                      }}
                    />
                  </TextField>
                  <TextField label="Favicon Upload">
                    <FileField
                      accept="image/*"
                      value={form.watch('brand.faviconUrl')}
                      onChange={async (file) => {
                        const value = await readFileAsDataUrl(file);
                        form.setValue('brand.faviconUrl', value, { shouldDirty: true, shouldValidate: true });
                      }}
                    />
                  </TextField>
                </SectionGrid>
              </Panel>

              <Panel title="Theme Settings">
                <SectionGrid>
                  <TextField label="Theme Mode">
                    <select className={inputClass} {...form.register('theme.mode')}>
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="system">System</option>
                    </select>
                  </TextField>
                  <TextField label="Density">
                    <select className={inputClass} {...form.register('theme.density')}>
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </TextField>
                </SectionGrid>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Security Settings">
                <SectionGrid>
                  <TextField label="Session Timeout (minutes)" error={form.formState.errors.security?.sessionTimeoutMinutes?.message}>
                    <input className={inputClass} type="number" {...form.register('security.sessionTimeoutMinutes')} />
                  </TextField>
                  <TextField label="Password Policy" error={form.formState.errors.security?.passwordMinLength?.message}>
                    <input className={inputClass} type="number" {...form.register('security.passwordMinLength')} />
                  </TextField>
                </SectionGrid>
              </Panel>

              <Panel title="SMTP / Email">
                <SectionGrid>
                  <TextField label="SMTP Host">
                    <input className={inputClass} {...form.register('smtp.host')} />
                  </TextField>
                  <TextField label="SMTP Port">
                    <input className={inputClass} type="number" {...form.register('smtp.port')} />
                  </TextField>
                  <TextField label="SMTP Username">
                    <input className={inputClass} {...form.register('smtp.username')} />
                  </TextField>
                  <TextField label="From Email">
                    <input className={inputClass} {...form.register('smtp.fromEmail')} />
                  </TextField>
                </SectionGrid>
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="API / Webhook">
                <SectionGrid>
                  <TextField label="API Base URL">
                    <input className={inputClass} {...form.register('integrations.apiBaseUrl')} />
                  </TextField>
                  <TextField label="Webhook URL">
                    <input className={inputClass} {...form.register('integrations.webhookUrl')} />
                  </TextField>
                  <TextField label="Enable Webhooks">
                    <input className="h-4 w-4 accent-cyan-400" type="checkbox" {...form.register('webhook.enabled')} />
                  </TextField>
                  <TextField label="Webhook Endpoint">
                    <input className={inputClass} {...form.register('webhook.endpoint')} />
                  </TextField>
                </SectionGrid>
              </Panel>

              <Panel title="Backup / Audit">
                <SectionGrid>
                  <TextField label="Backup Enabled">
                    <input className="h-4 w-4 accent-cyan-400" type="checkbox" {...form.register('backup.enabled')} />
                  </TextField>
                  <TextField label="Backup Frequency">
                    <input className={inputClass} {...form.register('backup.frequency')} />
                  </TextField>
                  <TextField label="Audit Retention Days">
                    <input className={inputClass} type="number" {...form.register('audit.retentionDays')} />
                  </TextField>
                  <TextField label="Email From Name">
                    <input className={inputClass} {...form.register('email.fromName')} />
                  </TextField>
                </SectionGrid>
              </Panel>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                type="submit"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white"
                type="button"
                onClick={() => form.reset(normalizeSettings(settingsQuery.data))}
              >
                Reset
              </button>
            </div>
          </form>
        ) : null}
      </PageShell>
    </ProtectedLayout>
  );
}

function normalizeSettings(settings: SettingsShape): SettingsForm {
  return {
    general: settings.general ?? defaults.general,
    company: settings.company ?? defaults.company,
    brand: settings.brand ?? defaults.brand,
    theme: settings.theme ?? defaults.theme,
    integrations: settings.integrations ?? defaults.integrations,
    security: settings.security ?? defaults.security,
    audit: settings.audit ?? defaults.audit,
    backup: settings.backup ?? defaults.backup,
    webhook: settings.webhook ?? defaults.webhook,
    smtp: settings.smtp ?? defaults.smtp,
    email: settings.email ?? defaults.email
  };
}

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500';

function SectionGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function TextField({ label, children, error }: { label: string; children: ReactNode; error?: string }) {
  return (
    <label className="space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      {children}
      {error ? <div className="text-xs text-rose-300">{error}</div> : null}
    </label>
  );
}

function FileField({
  accept,
  value,
  onChange
}: {
  accept: string;
  value: string;
  onChange: (file: File) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      <input
        className={inputClass}
        type="file"
        accept={accept}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onChange(file);
        }}
      />
      {value ? <div className="truncate text-xs text-slate-400">Selected</div> : null}
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });
}
