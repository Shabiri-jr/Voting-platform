"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CircleNotchIcon,
  EnvelopeSimpleIcon,
  LockKeyIcon,
} from "@phosphor-icons/react";
import { Alert } from "@/components/shared/Alert";
import { readJsonResponse } from "@/lib/client-response";

export function AdminLoginForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(data.get("email") ?? "").trim(),
          password: String(data.get("password") ?? ""),
        }),
      });
      const result = await readJsonResponse<{
        success?: boolean;
        message?: string;
      }>(response);

      if (response.status === 429) {
        setError("Too many login attempts. Wait a minute and try again.");
        return;
      }

      if (!response.ok || !result?.success) {
        setError(result?.message ?? "Email or password is incorrect.");
        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Login is temporarily unavailable. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {error ? <Alert title={error} tone="error" /> : null}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-semibold text-navy">
          Email address
        </label>
        <div className="relative">
          <EnvelopeSimpleIcon
            className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="min-h-13 w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-navy shadow-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-navy">
          Password
        </label>
        <div className="relative">
          <LockKeyIcon
            className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="min-h-13 w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-navy shadow-sm focus:border-accent focus:outline-none"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-13 w-full items-center justify-center gap-3 rounded-xl bg-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-navy-strong active:translate-y-px disabled:opacity-65"
      >
        {isPending ? (
          <>
            <CircleNotchIcon className="size-5 animate-spin" aria-hidden />
            Signing in
          </>
        ) : (
          "Sign in securely"
        )}
      </button>
    </form>
  );
}
