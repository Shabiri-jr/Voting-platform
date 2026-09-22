import type { Icon } from "@phosphor-icons/react";

type DashboardCardProps = {
  label: string;
  value: string | number;
  note?: string;
  icon: Icon;
  accent?: boolean;
};

export function DashboardCard({
  label,
  value,
  note,
  icon: Icon,
  accent = false,
}: DashboardCardProps) {
  return (
    <article
      className={[
        "relative overflow-hidden rounded-2xl border p-5 sm:p-6",
        accent ? "border-navy bg-navy text-white" : "bg-white text-navy",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={[
              "text-xs font-bold uppercase tracking-[0.14em]",
              accent ? "text-white/60" : "text-slate-500",
            ].join(" ")}
          >
            {label}
          </p>
          <p className="metric-number mt-3 text-3xl font-semibold tracking-[-0.05em]">
            {value}
          </p>
          {note ? (
            <p className={`mt-2 text-xs ${accent ? "text-white/60" : "text-slate-500"}`}>
              {note}
            </p>
          ) : null}
        </div>
        <span
          className={[
            "grid size-10 place-items-center rounded-xl",
            accent ? "bg-white/10 text-brand-300" : "bg-slate-100 text-accent",
          ].join(" ")}
        >
          <Icon className="size-5" weight="fill" aria-hidden />
        </span>
      </div>
    </article>
  );
}
