import type { Icon } from "@phosphor-icons/react";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { StudentShell } from "@/components/student/StudentShell";

type StatusPageProps = {
  icon: Icon;
  eyebrow: string;
  title: string;
  description: string;
  tone?: "success" | "warning" | "neutral";
  actionLabel?: string;
  actionHref?: string;
};

const tones = {
  success: "bg-brand-100 text-accent",
  warning: "bg-amber-100 text-amber-700",
  neutral: "bg-slate-200 text-slate-600",
};

export function StatusPage({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone = "neutral",
  actionLabel = "Return to home",
  actionHref = "/",
}: StatusPageProps) {
  return (
    <StudentShell>
      <section className="mx-auto max-w-xl rounded-[2rem] border bg-white px-6 py-12 text-center surface-shadow sm:px-12">
        <span className={`mx-auto grid size-16 place-items-center rounded-2xl ${tones[tone]}`}>
          <Icon className="size-9" weight="fill" aria-hidden />
        </span>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.045em] text-navy">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
        <ButtonLink href={actionHref} className="mt-8 w-full sm:w-auto">
          {actionLabel}
        </ButtonLink>
      </section>
    </StudentShell>
  );
}
