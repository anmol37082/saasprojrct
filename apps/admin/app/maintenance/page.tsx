export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] px-4 text-white">
      <div className="max-w-xl rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center shadow-2xl shadow-slate-950/40">
        <div className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Maintenance</div>
        <h1 className="mt-3 text-3xl font-semibold">Service temporarily unavailable</h1>
        <p className="mt-2 text-sm text-slate-300">We are applying updates. Please retry shortly.</p>
      </div>
    </div>
  );
}
