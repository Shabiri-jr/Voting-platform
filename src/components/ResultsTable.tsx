import { CrownSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { ResultItem } from "@/components/ResultChart";

type ResultsTableProps = {
  results: ResultItem[];
  final?: boolean;
};

export function ResultsTable({ results, final = false }: ResultsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white">
      <table className="w-full min-w-[620px] border-collapse text-left text-sm">
        <caption className="sr-only">Candidate ranking and vote totals</caption>
        <thead>
          <tr className="border-b bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <th scope="col" className="px-5 py-4 font-semibold">Rank</th>
            <th scope="col" className="px-5 py-4 font-semibold">Candidate</th>
            <th scope="col" className="px-5 py-4 text-right font-semibold">Votes</th>
            <th scope="col" className="px-5 py-4 text-right font-semibold">Share</th>
            <th scope="col" className="px-5 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {results.map((result) => (
            <tr key={result.candidateId} className="hover:bg-slate-50/70">
              <td className="metric-number px-5 py-4 text-slate-500">
                {String(result.rank).padStart(2, "0")}
              </td>
              <th scope="row" className="px-5 py-4 font-semibold text-navy">
                {result.candidateName}
              </th>
              <td className="metric-number px-5 py-4 text-right font-semibold text-navy">
                {result.votes.toLocaleString()}
              </td>
              <td className="metric-number px-5 py-4 text-right text-slate-600">
                {result.percentage.toFixed(1)}%
              </td>
              <td className="px-5 py-4">
                {result.rank === 1 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-800">
                    <CrownSimpleIcon className="size-3.5" weight="fill" aria-hidden />
                    {result.tied
                      ? final
                        ? "Tied winner"
                        : "Tied lead"
                      : final
                        ? "Winner"
                        : "Leading"}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Counting</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
