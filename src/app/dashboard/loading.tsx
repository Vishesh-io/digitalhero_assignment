export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="mt-3 h-8 w-56 rounded-lg bg-white/10" />
        </div>
        <div className="h-8 w-36 rounded-full bg-white/10" />
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

      {/* Two columns skeleton */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="h-5 w-32 rounded bg-white/10" />
          <div className="mt-4 flex gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="size-11 rounded-full bg-white/10" />
            ))}
          </div>
          <div className="mt-6 h-10 w-full rounded-full bg-white/10" />
        </div>
        <div className="card p-6">
          <div className="h-5 w-36 rounded bg-white/10" />
          <div className="mt-4 h-16 w-full rounded-xl bg-white/5" />
          <div className="mt-4 h-10 w-full rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
