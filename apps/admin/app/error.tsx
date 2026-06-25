"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-slate-950/30">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/60">Application error</div>
        <h1 className="mt-3 text-2xl font-semibold">Something broke while rendering this page.</h1>
        <p className="mt-3 text-sm text-slate-300">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

