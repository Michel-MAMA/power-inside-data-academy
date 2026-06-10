export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-6xl animate-pulse px-4 py-10">
      <div className="mb-8 space-y-2">
        <div className="h-7 w-64 rounded bg-slate-200" />
        <div className="h-4 w-80 rounded bg-slate-100" />
      </div>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-100 bg-white" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-44 rounded-2xl border border-slate-100 bg-white" />
        ))}
      </div>
    </main>
  );
}
