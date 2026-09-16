export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="mt-3 h-8 w-60 rounded-lg bg-white/10" />
        </div>
        <div className="h-8 w-44 rounded-full bg-white/10" />
      </div>

      {/* Metric cards skeleton */}
      <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5">
            <div className="size-9 rounded-xl bg-white/10" />
            <div className="mt-3 h-7 w-20 rounded bg-white/10" />
            <div className="mt-2 h-3.5 w-28 rounded bg-white/5" />
            <div className="mt-1 h-3 w-36 rounded bg-white/5" />
          </div>
        ))}
      </div>

      {/* Body card skeleton */}
      <div className="card mt-8 p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="h-8 w-28 rounded-full bg-white/10" />
        </div>
        <div className="mt-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-white/10" />
                <div>
                  <div className="h-4 w-32 rounded bg-white/10" />
                  <div className="mt-1.5 h-3 w-44 rounded bg-white/5" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
