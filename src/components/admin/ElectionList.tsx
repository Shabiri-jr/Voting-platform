import Link from "next/link";
import { ElectionStatusBadge } from "@/components/ElectionStatusBadge";
import { formatLagosDateTime } from "@/lib/date";
import type { ElectionRecord } from "@/types";

type ElectionListProps = {
  elections: ElectionRecord[];
  selectedElectionId?: string;
};

export function ElectionList({
  elections,
  selectedElectionId,
}: ElectionListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-5 py-4 sm:px-6">
        <h2 className="font-semibold text-navy">All elections</h2>
        <p className="mt-1 text-sm text-slate-500">
          Each election keeps its own ballot configuration, participation, and results.
        </p>
      </div>
      <div className="divide-y">
        {elections.map((election) => {
          const selected = election.id === selectedElectionId;

          return (
            <article
              key={election.id}
              className={[
                "flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6",
                selected ? "bg-brand-50/60" : "",
              ].join(" ")}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold text-navy">{election.title}</h3>
                  <ElectionStatusBadge status={election.status} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {formatLagosDateTime(election.startTime)} to{" "}
                  {formatLagosDateTime(election.endTime)}
                </p>
              </div>
              <Link
                href={`/admin/elections?electionId=${election.id}`}
                aria-current={selected ? "page" : undefined}
                className={[
                  "inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition",
                  selected
                    ? "border-brand-200 bg-white text-brand-800"
                    : "border-slate-300 bg-white text-navy hover:bg-slate-50",
                ].join(" ")}
              >
                {selected ? "Selected" : "Manage"}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
