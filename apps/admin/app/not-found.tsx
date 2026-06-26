import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 text-white">
      <div className="max-w-xl rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center shadow-2xl shadow-slate-950/40">
        <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">404</div>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-300">The requested route does not exist or was moved.</p>
        <Link className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950" href="/dashboard">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
