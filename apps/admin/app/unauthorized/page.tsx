import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.18),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 text-white">
      <div className="max-w-xl rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center shadow-2xl shadow-slate-950/40">
        <div className="text-xs uppercase tracking-[0.35em] text-rose-200/70">401</div>
        <h1 className="mt-3 text-3xl font-semibold">Unauthorized</h1>
        <p className="mt-2 text-sm text-slate-300">You need to sign in again or do not have access to this resource.</p>
        <Link className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950" href="/login">
          Sign in
        </Link>
      </div>
    </div>
  );
}
