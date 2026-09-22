import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  FingerprintSimpleIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Navbar } from "@/components/Navbar";

const assurances = [
  "One verified ballot per eligible student",
  "Votes stored without matric numbers",
  "Election access closes automatically",
];

export default function HomePage() {
  return (
    <main id="main-content" className="min-h-[100dvh] bg-navy">
      <Navbar />
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] border-l border-white/10 bg-[radial-gradient(circle_at_70%_22%,rgba(121,174,82,0.2),transparent_34%),linear-gradient(135deg,rgba(223,237,213,0.1),rgba(4,45,8,0))] lg:block"
          aria-hidden
        />
        <div className="relative mx-auto grid min-h-[calc(100dvh-5rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              <span className="size-1.5 rounded-full bg-brand-400" />
              2026 Student Union Election
            </p>
            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-7xl">
              Your campus.
              <span className="mt-2 block text-brand-300">Your decision.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              DUCRISA is the department&apos;s secure digital ballot. Verify your
              eligibility, review every position, and cast your vote in a few clear
              steps.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/verify"
                className="inline-flex min-h-13 items-center justify-center gap-3 rounded-xl bg-white px-6 py-3 text-sm font-bold text-navy transition hover:bg-brand-50 active:translate-y-px"
              >
                Start voting
                <ArrowRightIcon className="size-5" weight="bold" aria-hidden />
              </Link>
              <Link
                href="/admin/login"
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10 active:translate-y-px"
              >
                Election administration
              </Link>
            </div>
          </div>

          <div className="lg:pl-12">
            <div className="surface-shadow overflow-hidden rounded-[2rem] border border-white/15 bg-white text-navy">
              <div className="border-b bg-slate-50 px-6 py-5 sm:px-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
                      Ballot process
                    </p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight">
                      Built for trust and clarity
                    </h2>
                  </div>
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-accent">
                    <ShieldCheckIcon className="size-7" weight="fill" aria-hidden />
                  </span>
                </div>
              </div>
              <ol className="divide-y px-6 sm:px-8">
                {[
                  ["01", "Verify your details", "Use your matric number and surname."],
                  ["02", "Complete your ballot", "Choose one candidate for each position."],
                  ["03", "Review and submit", "Confirm once. Your ballot cannot be changed."],
                ].map(([number, title, description]) => (
                  <li key={number} className="grid grid-cols-[3rem_1fr] gap-4 py-6">
                    <span className="metric-number text-sm font-semibold text-accent">
                      {number}
                    </span>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="m-6 rounded-2xl bg-navy p-5 text-white sm:m-8">
                <div className="flex gap-4">
                  <FingerprintSimpleIcon
                    className="mt-0.5 size-6 shrink-0 text-brand-300"
                    aria-hidden
                  />
                  <div>
                    <p className="font-semibold">
                      Your choices are separated from your identity
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Student eligibility and anonymous vote records are kept
                      separate. Election officers can see turnout, not a
                      student-to-candidate record.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-navy-strong">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-7 text-sm text-white/75 sm:px-6 md:grid-cols-3 lg:px-8">
          {assurances.map((assurance) => (
            <p key={assurance} className="flex items-center gap-2">
              <CheckCircleIcon className="size-5 text-brand-300" weight="fill" />
              {assurance}
            </p>
          ))}
        </div>
      </section>
    </main>
  );
}
