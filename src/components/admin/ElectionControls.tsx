"use client";

import { PauseIcon, PlayIcon, StopIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ElectionStatusBadge } from "@/components/ElectionStatusBadge";
import { Alert } from "@/components/shared/Alert";
import {
  type AdminFormAction,
  useAdminAction,
} from "@/components/admin/useAdminAction";

type ElectionControlsProps = {
  electionId: string;
  status: "pending" | "open" | "paused" | "closed";
  endTime: string;
  reopenEndTime?: string;
  action?: AdminFormAction;
  readOnly?: boolean;
};

export function ElectionControls({
  electionId,
  status,
  endTime,
  reopenEndTime,
  action,
  readOnly = false,
}: ElectionControlsProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useAdminAction(action);
  const isReopening = status === "closed";

  useEffect(() => {
    if (status !== "open") return;

    const remaining = new Date(endTime).getTime() - Date.now();
    if (remaining <= 0) {
      router.refresh();
      return;
    }

    const timer = window.setTimeout(
      () => router.refresh(),
      Math.min(remaining + 1_000, 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [endTime, router, status]);

  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6">
      {state.message ? (
        <div className="mb-5">
          <Alert title={state.message} tone={state.success ? "success" : "error"} />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            Current status
          </p>
          <div className="mt-2">
            <ElectionStatusBadge status={status} />
          </div>
        </div>
        {readOnly ? (
          <p className="text-sm text-slate-500">Viewer accounts cannot change status.</p>
        ) : (
          <form
            action={formAction}
            className="flex flex-wrap gap-2"
            aria-describedby={isReopening ? "reopen-election-note" : undefined}
            onSubmit={(event) => {
              if (
                isReopening &&
                !window.confirm(
                  "Reopen this election? Eligible students who have not voted will be able to vote during the configured election window. Existing votes will remain counted.",
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="electionId" value={electionId} />
            {isReopening ? (
              <label className="w-full sm:w-auto">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  New closing time
                </span>
                <input
                  type="datetime-local"
                  name="reopenEndTime"
                  defaultValue={reopenEndTime}
                  required
                  className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
            ) : null}
            {status !== "open" ? (
              <button
                type="submit"
                disabled={isPending}
                name="status"
                value="open"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
              >
                <PlayIcon className="size-4" weight="fill" aria-hidden />
                {isPending
                  ? isReopening
                    ? "Reopening voting"
                    : "Opening voting"
                  : isReopening
                    ? "Reopen voting"
                    : "Open voting"}
              </button>
            ) : null}
            {status === "open" ? (
              <button
                type="submit"
                disabled={isPending}
                name="status"
                value="paused"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
              >
                <PauseIcon className="size-4" weight="fill" aria-hidden />
                Pause voting
              </button>
            ) : null}
            {status !== "closed" ? (
              <button
                type="submit"
                disabled={isPending}
                name="status"
                value="closed"
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800 hover:bg-red-100"
              >
                <StopIcon className="size-4" weight="fill" aria-hidden />
                Close voting
              </button>
            ) : null}
          </form>
        )}
      </div>
      {status === "closed" ? (
        <p
          id="reopen-election-note"
          className="mt-5 border-t pt-5 text-sm leading-6 text-slate-600"
        >
          Reopening resumes voting only for eligible students who have not voted.
          Existing ballots and voter participation records remain unchanged, and
          results are no longer treated as final while voting is open. Choose a new
          closing time in the future before reopening.
        </p>
      ) : null}
    </section>
  );
}
