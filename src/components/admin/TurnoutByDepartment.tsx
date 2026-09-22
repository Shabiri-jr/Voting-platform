export type DepartmentTurnout = {
  department: string;
  eligible: number;
  voted: number;
};

export function TurnoutByDepartment({
  departments,
}: {
  departments: DepartmentTurnout[];
}) {
  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-navy">
        Turnout by department
      </h2>
      <div className="mt-6 space-y-5">
        {departments.map((item) => {
          const percentage =
            item.eligible === 0 ? 0 : (item.voted / item.eligible) * 100;
          return (
            <div key={item.department}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                <p className="truncate font-medium text-navy">{item.department}</p>
                <p className="metric-number shrink-0 text-xs text-slate-500">
                  {item.voted}/{item.eligible} · {percentage.toFixed(1)}%
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
