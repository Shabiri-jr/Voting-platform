import { ButtonLink } from "@/components/shared/ButtonLink";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-slate-100 px-4 py-12">
      <section className="max-w-lg text-center">
        <p className="metric-number text-sm font-bold text-accent">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-navy">
          Page not found
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          This page may have moved, or your election session may have expired.
        </p>
        <ButtonLink href="/" className="mt-7">
          Return to DUCRISA
        </ButtonLink>
      </section>
    </main>
  );
}
