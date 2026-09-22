import type { Metadata } from "next";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Logo } from "@/components/shared/Logo";

export const metadata: Metadata = {
  title: "Admin login",
};

export default function AdminLoginPage() {
  return (
    <main id="main-content" className="grid min-h-[100dvh] bg-slate-100 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md rounded-[2rem] border bg-white p-6 surface-shadow sm:p-9">
          <Logo />
          <p className="mt-10 text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Authorized access
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-navy">
            Election administration
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Sign in with your approved administrator account. All management actions
            are recorded in the audit log.
          </p>
          <AdminLoginForm />
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-navy p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-32 left-20 size-[30rem] rounded-full border border-white/10" />
        <ShieldCheckIcon className="relative size-12 text-brand-300" weight="fill" />
        <div className="relative max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
            DUCRISA control centre
          </p>
          <h2 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-[-0.055em]">
            Operate the election without compromising the ballot.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Manage eligibility, positions, candidates, election status, and
            aggregate results. Individual voting choices are never available here.
          </p>
        </div>
        <p className="relative text-sm text-white/45">
          Access is restricted by role and reviewed after every election.
        </p>
      </aside>
    </main>
  );
}
