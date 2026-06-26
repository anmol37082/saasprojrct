"use client";

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

const schema = z.object({
  email: z.string().email('Enter a valid email')
});

type ForgotPasswordForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(schema) });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/60">Account</div>
          <h1 className="text-3xl font-semibold">Forgot password</h1>
          <p className="text-sm text-slate-300">Request a password reset link for your admin account.</p>
        </div>
        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit(async () => {
            setSent(true);
          })}
        >
          <label className="block space-y-2 text-sm text-slate-300">
            <span>Email</span>
            <input className={inputClass} type="email" autoComplete="email" {...register('email')} />
            {errors.email ? <span className="text-xs text-rose-300">{errors.email.message}</span> : null}
          </label>
          {sent ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">If that account exists, a reset link would be sent.</div> : null}
          <button className="w-full rounded-full bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
        <div className="mt-6 text-sm text-slate-300">
          <Link className="text-cyan-200" href="/login">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500';
