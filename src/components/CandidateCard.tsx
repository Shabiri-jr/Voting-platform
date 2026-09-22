"use client";

import { memo } from "react";
import { CheckIcon } from "@phosphor-icons/react";
import { CandidateAvatar } from "@/components/shared/CandidateAvatar";

export type BallotCandidate = {
  id: string;
  fullName: string;
  department: string;
  level: string;
  photoUrl?: string | null;
  manifesto?: string | null;
};

type CandidateCardProps = {
  candidate: BallotCandidate;
  positionId: string;
  selected: boolean;
  onSelect: (positionId: string, candidateId: string) => void;
};

export const CandidateCard = memo(function CandidateCard({
  candidate,
  positionId,
  selected,
  onSelect,
}: CandidateCardProps) {
  return (
    <label
      className={[
        "group relative grid cursor-pointer grid-cols-[auto_1fr_auto] gap-4 rounded-2xl border p-4 transition duration-200 focus-within:ring-3 focus-within:ring-brand-300 focus-within:ring-offset-2 sm:p-5",
        selected
          ? "border-accent bg-brand-50 shadow-[inset_0_0_0_1px_#4f8d2f]"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-400",
      ].join(" ")}
    >
      <input
        type="radio"
        name={`position-${positionId}`}
        value={candidate.id}
        checked={selected}
        onChange={() => onSelect(positionId, candidate.id)}
        className="sr-only"
      />
      <CandidateAvatar
        name={candidate.fullName}
        photoUrl={candidate.photoUrl}
        size="ballot"
      />
      <span className="min-w-0">
        <span className="block font-semibold text-navy">{candidate.fullName}</span>
        <span className="mt-1 block text-sm text-slate-600">
          {candidate.department} · {candidate.level}
        </span>
        {candidate.manifesto ? (
          <span className="mt-3 line-clamp-2 block text-sm leading-6 text-slate-500">
            {candidate.manifesto}
          </span>
        ) : null}
      </span>
      <span
        className={[
          "mt-1 grid size-6 place-items-center rounded-full border transition",
          selected
            ? "border-accent bg-accent text-white"
            : "border-slate-300 bg-white text-transparent",
        ].join(" ")}
        aria-hidden
      >
        <CheckIcon className="size-4" weight="bold" />
      </span>
    </label>
  );
});
