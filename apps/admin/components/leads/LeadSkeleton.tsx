"use client";

export function LeadSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
          <div className="mt-3 h-3 w-3/4 animate-pulse rounded-full bg-white/10" />
          <div className="mt-6 space-y-2">
            <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="mt-5 flex gap-2">
            <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
