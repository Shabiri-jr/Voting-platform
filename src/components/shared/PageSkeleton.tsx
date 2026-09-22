export function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading page" aria-busy="true">
      <div className="h-3 w-28 rounded bg-slate-200" />
      <div className="mt-4 h-10 w-72 max-w-full rounded bg-slate-200" />
      <div className="mt-4 h-5 w-[34rem] max-w-full rounded bg-slate-200" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="mt-8 h-80 rounded-2xl bg-white" />
    </div>
  );
}
