/** Skeleton loader du catalogue. */
export default function FormationsLoading() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse px-4 py-12">
      <div className="mb-10 space-y-3">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>
      <div className="mb-8 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 p-6">
            <div className="mb-4 h-5 w-28 rounded-full bg-slate-100" />
            <div className="h-5 w-full rounded bg-slate-200" />
            <div className="mt-2 h-5 w-3/4 rounded bg-slate-200" />
            <div className="mt-4 h-4 w-full rounded bg-slate-100" />
            <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
            <div className="mt-6 flex justify-between border-t border-slate-100 pt-4">
              <div className="h-6 w-20 rounded bg-slate-200" />
              <div className="h-6 w-24 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
