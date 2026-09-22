import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
};

const variants = {
  primary:
    "border-navy bg-navy text-white hover:border-navy-strong hover:bg-navy-strong",
  secondary:
    "border-slate-300 bg-white text-navy hover:border-slate-400 hover:bg-slate-50",
  quiet:
    "border-transparent bg-transparent text-navy hover:bg-slate-100",
  danger:
    "border-red-700 bg-red-700 text-white hover:border-red-800 hover:bg-red-800",
};

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold transition duration-200 active:translate-y-px",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
