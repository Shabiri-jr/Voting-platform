"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-slate-100 px-4 py-12">
      <section className="max-w-lg rounded-[2rem] border bg-white p-8 text-center surface-shadow">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-700">
          <WarningCircleIcon className="size-8" weight="fill" aria-hidden />
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-navy">
          Something went wrong
        </h1>
        <p className="mt-3 leading-7 text-slate-600">
          The requested information could not be loaded. No vote or administrative
          change has been submitted from this screen.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 min-h-11 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
