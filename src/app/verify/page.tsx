import type { Metadata } from "next";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { StudentShell } from "@/components/student/StudentShell";
import { VerifyForm } from "@/components/student/VerifyForm";

export const metadata: Metadata = {
  title: "Verify eligibility",
};

export default function VerifyPage() {
  return (
    <StudentShell step="Step 1 of 3">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-start">
        <section className="rounded-[2rem] border bg-white p-6 surface-shadow sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Student verification
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-navy md:text-4xl">
            Confirm your eligibility
          </h1>
          <p className="mt-4 max-w-xl leading-7 text-slate-600">
            Enter your registered details. This check creates a temporary ballot
            session and does not place your identity inside the vote record.
          </p>
          <VerifyForm />
        </section>

        <aside className="rounded-[2rem] bg-navy p-7 text-white lg:mt-16">
          <ShieldCheckIcon className="size-8 text-brand-300" weight="fill" aria-hidden />
          <h2 className="mt-5 text-xl font-semibold tracking-tight">
            Before you continue
          </h2>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <li>Use only your own student details.</li>
            <li>You may submit one ballot in this election.</li>
            <li>Review all selections before final confirmation.</li>
            <li>Ask the election officer for help without revealing your choices.</li>
          </ul>
        </aside>
      </div>
    </StudentShell>
  );
}
