export type ResultItem = {
  candidateId: string;
  candidateName: string;
  votes: number;
  percentage: number;
  rank: number;
  tied?: boolean;
};

type ResultChartProps = {
  title: string;
  results: ResultItem[];
};

export function ResultChart({ title, results }: ResultChartProps) {
  const maxVotes = Math.max(...results.map((result) => result.votes), 1);

  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-navy">{title}</h2>
        <p className="metric-number text-xs text-slate-500">
          {results.reduce((total, result) => total + result.votes, 0)} votes
        </p>
      </div>
      <div className="mt-6 space-y-5">
        {results.map((result) => (
          <div key={result.candidateId}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <p className="truncate font-medium text-navy">{result.candidateName}</p>
              <p className="metric-number shrink-0 text-slate-600">
                {result.votes} / {result.percentage.toFixed(1)}%
              </p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={[
                  "h-full rounded-full transition-[width] duration-500",
                  result.rank === 1 ? "bg-accent" : "bg-slate-400",
                ].join(" ")}
                style={{ width: `${(result.votes / maxVotes) * 100}%` }}
                role="img"
                aria-label={`${result.candidateName}: ${result.votes} votes, ${result.percentage.toFixed(1)} percent`}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
