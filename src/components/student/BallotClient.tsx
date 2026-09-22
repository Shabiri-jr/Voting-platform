"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { Alert } from "@/components/shared/Alert";
import { BallotCandidate, CandidateCard } from "@/components/CandidateCard";
import { readJsonResponse } from "@/lib/client-response";

type BallotPosition = {
  id: string;
  title: string;
  description?: string | null;
  displayOrder: number;
  required: boolean;
  candidates: BallotCandidate[];
};

type BallotPayload = {
  election: {
    id: string;
    title: string;
    description?: string | null;
  };
  positions: BallotPosition[];
};

type VoteStatus =
  | "success"
  | "already_voted"
  | "closed"
  | "expired"
  | "invalid";

export function BallotClient() {
  const router = useRouter();
  const [ballot, setBallot] = useState<BallotPayload | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBallot() {
      try {
        const response = await fetch("/api/ballot", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          router.replace("/verify");
          return;
        }

        const data = (await response.json()) as BallotPayload & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.message ?? "The ballot could not be loaded.");
        }

        setBallot(data);
      } catch (loadError) {
        if ((loadError as Error).name !== "AbortError") {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "The ballot could not be loaded.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadBallot();
    return () => controller.abort();
  }, [router]);

  useEffect(() => {
    if (isReviewing) reviewHeadingRef.current?.focus();
  }, [isReviewing]);

  const requiredPositions = useMemo(
    () => ballot?.positions.filter((position) => position.required) ?? [],
    [ballot],
  );
  const completedCount = ballot
    ? ballot.positions.filter((position) => selections[position.id]).length
    : 0;
  const requiredComplete = requiredPositions.every(
    (position) => selections[position.id],
  );

  const handleSelect = useCallback((positionId: string, candidateId: string) => {
    setSelections((current) => ({ ...current, [positionId]: candidateId }));
    setError(null);
  }, []);

  function beginReview() {
    if (!requiredComplete || Object.keys(selections).length === 0) {
      setError("Please select one candidate for each required position.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setError(null);
    setIsReviewing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitBallot() {
    if (!ballot || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selections: Object.entries(selections).map(
            ([positionId, candidateId]) => ({ positionId, candidateId }),
          ),
        }),
      });
      const result = await readJsonResponse<{
        status?: VoteStatus;
        message?: string;
      }>(response);

      if (response.status === 429) {
        setError("Too many submission attempts. Wait a minute, then try again.");
        setIsReviewing(false);
        return;
      }

      if (result?.status === "success") {
        router.replace("/success");
        return;
      }
      if (result?.status === "already_voted") {
        router.replace("/already-voted");
        return;
      }
      if (result?.status === "closed") {
        router.replace("/voting-closed");
        return;
      }
      if (result?.status === "expired") {
        router.replace("/verify");
        return;
      }

      setError(
        result?.message ??
          "Your vote could not be submitted. Please contact the election officer.",
      );
      setIsReviewing(false);
    } catch {
      setError(
        "We could not confirm whether your vote was submitted. Do not start another ballot; ask the election officer to check your status.",
      );
      setIsReviewing(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <BallotSkeleton />;
  }

  if (error && !ballot) {
    return (
      <div className="rounded-2xl border bg-white p-6 md:p-8">
        <Alert title="Ballot unavailable" tone="error">
          {error}
        </Alert>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 min-h-11 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!ballot) return null;

  if (isReviewing) {
    return (
      <section aria-labelledby="review-title">
        <div className="border-b pb-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Final step
          </p>
          <h1
            id="review-title"
            ref={reviewHeadingRef}
            tabIndex={-1}
            className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-navy md:text-4xl"
          >
            Review your ballot
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            Check every selection carefully. Once submitted, your ballot cannot be
            changed or withdrawn.
          </p>
        </div>

        {error ? <div className="mt-6"><Alert title={error} tone="error" /></div> : null}

        <div className="mt-8 overflow-hidden rounded-2xl border bg-white">
          {ballot.positions.map((position) => {
            const selected = position.candidates.find(
              (candidate) => candidate.id === selections[position.id],
            );
            return (
              <div
                key={position.id}
                className="grid gap-2 border-b px-5 py-5 last:border-b-0 sm:grid-cols-[1fr_1.4fr] sm:px-7"
              >
                <p className="text-sm font-semibold text-slate-500">{position.title}</p>
                <p className="font-semibold text-navy">
                  {selected?.fullName ?? "No selection"}
                </p>
              </div>
            );
          })}
        </div>

        <Alert title="You are about to submit your vote" tone="warning">
          This action is final. DUCRISA stores vote rows separately from your
          student record and does not place your matric number in the votes table.
        </Alert>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => setIsReviewing(false)}
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border bg-white px-5 py-3 text-sm font-semibold text-navy hover:bg-slate-50 disabled:opacity-60"
          >
            <ArrowLeftIcon className="size-4" aria-hidden />
            Go back
          </button>
          <button
            type="button"
            onClick={submitBallot}
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-strong active:translate-y-px disabled:opacity-65"
          >
            {isSubmitting ? (
              <>
                <CircleNotchIcon className="size-5 animate-spin" aria-hidden />
                Submitting securely
              </>
            ) : (
              <>
                <ShieldCheckIcon className="size-5" weight="fill" aria-hidden />
                Confirm vote
              </>
            )}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="ballot-title">
      <div className="border-b pb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Official ballot
            </p>
            <h1
              id="ballot-title"
              className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-navy md:text-4xl"
            >
              {ballot.election.title}
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Select one candidate for each position. Your choices remain on this
              device until you confirm the complete ballot.
            </p>
          </div>
          <div className="shrink-0 rounded-xl border bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Progress
            </p>
            <p className="metric-number mt-1 text-lg font-bold text-navy">
              {completedCount}/{ballot.positions.length}
            </p>
          </div>
        </div>
      </div>

      {error ? <div className="mt-6"><Alert title={error} tone="error" /></div> : null}

      <div className="mt-8 space-y-10">
        {ballot.positions.map((position, index) => (
          <fieldset key={position.id}>
            <legend className="w-full">
              <span className="flex items-start gap-4">
                <span className="metric-number mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-navy text-xs font-bold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-xl font-semibold tracking-tight text-navy">
                    {position.title}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    {position.description ??
                      `Choose one candidate for ${position.title}.`}
                  </span>
                </span>
              </span>
            </legend>
            {position.candidates.length ? (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {position.candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    positionId={position.id}
                    selected={selections[position.id] === candidate.id}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <WarningCircleIcon className="mt-0.5 size-5 shrink-0" aria-hidden />
                No candidates are available for this position. Contact the election
                officer.
              </div>
            )}
          </fieldset>
        ))}
      </div>

      <div className="sticky bottom-4 mt-12 rounded-2xl border bg-white/95 p-4 shadow-[0_16px_45px_-20px_rgba(7,27,49,0.45)] backdrop-blur sm:flex sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCircleIcon
            className={requiredComplete ? "size-5 text-accent" : "size-5 text-slate-400"}
            weight="fill"
            aria-hidden
          />
          {requiredComplete
            ? "All required positions completed"
            : "Complete every required position"}
        </p>
        <button
          type="button"
          onClick={beginReview}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-strong active:translate-y-px sm:mt-0 sm:w-auto"
        >
          Review ballot
          <ArrowRightIcon className="size-5" weight="bold" aria-hidden />
        </button>
      </div>
    </section>
  );
}

function BallotSkeleton() {
  return (
    <div aria-label="Loading ballot" aria-busy="true">
      <div className="animate-pulse border-b pb-7">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-3/5 rounded bg-slate-200" />
        <div className="mt-4 h-5 w-4/5 rounded bg-slate-200" />
      </div>
      <div className="mt-9 space-y-10">
        {[1, 2, 3].map((item) => (
          <div key={item} className="animate-pulse">
            <div className="h-7 w-44 rounded bg-slate-200" />
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <div className="h-28 rounded-2xl bg-white" />
              <div className="h-28 rounded-2xl bg-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
