"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { ElectionRecord } from "@/types";

type ElectionSwitcherProps = {
  elections: ElectionRecord[];
  selectedElectionId?: string;
};

export function ElectionSwitcher({
  elections,
  selectedElectionId,
}: ElectionSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const selectedElection = elections.find(
    (election) => election.id === selectedElectionId,
  );

  if (!elections.length) return null;

  return (
    <section className="mt-6 flex flex-col gap-3 rounded-2xl border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Working election
        </p>
        <p className="mt-1 text-sm text-slate-600">
          Data and changes on this page apply only to the selected election.
        </p>
      </div>
      <label className="min-w-0 sm:w-[26rem]">
        <span className="sr-only">Select an election</span>
        <select
          value={selectedElection?.id ?? ""}
          disabled={isPending}
          onChange={(event) => {
            const nextParams = new URLSearchParams(searchParams.toString());
            nextParams.set("electionId", event.target.value);
            startTransition(() => {
              router.push(`${pathname}?${nextParams.toString()}`);
            });
          }}
          className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-navy outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-wait disabled:opacity-60"
        >
          {elections.map((election) => (
            <option key={election.id} value={election.id}>
              {election.title} ({election.status})
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
