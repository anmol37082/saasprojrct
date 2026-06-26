"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type LoginValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, isAuthenticated } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<LoginValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const onSubmit = async (values: LoginValues) => {
    try {
      await login(values);
      router.push('/dashboard');
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Login failed' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/60">Admin access</div>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-slate-300">Use your backend-authenticated admin account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <label className="block space-y-2 text-sm text-slate-300">
            <span>Email</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              type="email"
              autoComplete="email"
              {...register('email')}
            />
            {errors.email ? <span className="text-xs text-rose-300">{errors.email.message}</span> : null}
          </label>

          <label className="block space-y-2 text-sm text-slate-300">
            <span>Password</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password ? <span className="text-xs text-rose-300">{errors.password.message}</span> : null}
          </label>

          {errors.root ? <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{errors.root.message}</div> : null}

          <button
            className="w-full rounded-full bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
            type="submit"
            disabled={loading || isSubmitting || isAuthenticated}
          >
            {loading || isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
          <div className="text-center text-sm text-slate-300">
            <Link className="text-cyan-200" href="/forgot-password">
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

