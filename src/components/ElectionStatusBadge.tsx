type ElectionStatus = "pending" | "open" | "paused" | "closed";

type ElectionStatusBadgeProps = {
  status: ElectionStatus;
};

const styles: Record<ElectionStatus, string> = {
  pending: "border-slate-200 bg-slate-100 text-slate-700",
  open: "border-brand-200 bg-brand-50 text-brand-800",
  paused: "border-amber-200 bg-amber-50 text-amber-800",
  closed: "border-red-200 bg-red-50 text-red-800",
};

export function ElectionStatusBadge({ status }: ElectionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${styles[status]}`}
    >
      <span
        className={[
          "size-1.5 rounded-full",
          status === "open"
            ? "bg-brand-500"
            : status === "paused"
              ? "bg-amber-500"
              : status === "closed"
                ? "bg-red-500"
                : "bg-slate-400",
        ].join(" ")}
        aria-hidden
      />
      {status}
    </span>
  );
}
