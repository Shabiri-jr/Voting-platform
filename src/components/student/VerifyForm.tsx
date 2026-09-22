"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CircleNotchIcon,
  IdentificationCardIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react";
import { Alert } from "@/components/shared/Alert";
import {
  MATRIC_NUMBER_EXAMPLE,
  MATRIC_NUMBER_FORMAT_MESSAGE,
  MATRIC_NUMBER_PATTERN,
  normalizeMatricNumber,
} from "@/lib/student-identifiers";
import { readJsonResponse } from "@/lib/client-response";

type VerificationStatus =
  | "verified"
  | "not_found"
  | "not_eligible"
  | "already_voted"
  | "closed"
  | "invalid";

const redirectByStatus: Partial<Record<VerificationStatus, string>> = {
  verified: "/ballot",
  not_found: "/not-eligible",
  not_eligible: "/not-eligible",
  already_voted: "/already-voted",
  closed: "/voting-closed",
};

export function VerifyForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const matricNumber = normalizeMatricNumber(
      String(form.get("matricNumber") ?? ""),
    );
    const surname = String(form.get("surname") ?? "").trim();

    if (!matricNumber || !surname) {
      setError("Enter both your matric number and surname.");
      return;
    }
    if (!MATRIC_NUMBER_PATTERN.test(matricNumber)) {
      setError(`Enter a valid matric number. ${MATRIC_NUMBER_FORMAT_MESSAGE}`);
      return;
    }

    setIsPending(true);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricNumber, surname }),
      });
      const result = await readJsonResponse<{
        status?: VerificationStatus;
        message?: string;
      }>(response);

      if (response.status === 429) {
        setError("Too many verification attempts. Wait a minute and try again.");
        return;
      }

      const redirect =
        response.ok && result?.status
          ? redirectByStatus[result.status]
          : undefined;
      if (redirect) {
        router.replace(redirect);
        return;
      }

      setError(
        result?.message ??
          "Your details could not be verified. Check them and try again.",
      );
    } catch {
      setError(
        "Something went wrong. Please contact the election officer at this voting point.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
      {error ? <Alert title={error} tone="error" /> : null}

      <div className="space-y-2">
        <label htmlFor="matricNumber" className="block text-sm font-semibold text-navy">
          Matric number
        </label>
        <div className="relative">
          <IdentificationCardIcon
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="matricNumber"
            name="matricNumber"
            type="text"
            required
            minLength={6}
            maxLength={30}
            pattern="DU([0-9]{4}|/[A-Z0-9]{2,12}/[0-9]{4}/[0-9]{3,6})"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={MATRIC_NUMBER_EXAMPLE}
            className="min-h-13 w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-base uppercase text-navy shadow-sm transition placeholder:normal-case placeholder:text-slate-400 hover:border-slate-400 focus:border-accent focus:outline-none"
          />
        </div>
        <p className="text-xs leading-5 text-slate-500">
          Enter the number exactly as shown on your student ID.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="surname" className="block text-sm font-semibold text-navy">
          Surname
        </label>
        <input
          id="surname"
          name="surname"
          type="text"
          required
          autoComplete="family-name"
          placeholder="e.g. Dabiri"
          className="min-h-13 w-full rounded-xl border bg-white px-4 py-3 text-base text-navy shadow-sm transition placeholder:text-slate-400 hover:border-slate-400 focus:border-accent focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-strong active:translate-y-px disabled:opacity-65"
      >
        {isPending ? (
          <>
            <CircleNotchIcon className="size-5 animate-spin" aria-hidden />
            Verifying details
          </>
        ) : (
          <>
            Continue to ballot
            <ArrowRightIcon className="size-5" weight="bold" aria-hidden />
          </>
        )}
      </button>

      <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
        <LockSimpleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
        Verification confirms eligibility only. Your matric number is not stored
        with your candidate selections.
      </p>
    </form>
  );
}
