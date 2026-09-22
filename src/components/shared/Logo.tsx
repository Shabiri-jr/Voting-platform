import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  compact?: boolean;
  inverse?: boolean;
  href?: string;
};

export function Logo({
  compact = false,
  inverse = false,
  href = "/",
}: LogoProps) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 rounded-md"
      aria-label="DUCRISA, Criminology and Security Studies Student Association, home"
    >
      <span
        className={[
          "relative grid shrink-0 place-items-center overflow-hidden rounded-xl border bg-white p-0.5 shadow-sm transition-transform group-active:scale-[0.98]",
          compact ? "size-10" : "size-14",
          inverse
            ? "border-white/25"
            : "border-navy/10",
        ].join(" ")}
        aria-hidden="true"
      >
        <Image
          src="/criminology-logo.jpeg"
          alt=""
          width={56}
          height={56}
          sizes={compact ? "40px" : "56px"}
          className="size-full rounded-[0.55rem] object-contain"
          priority
        />
      </span>
      {!compact ? (
        <span className="min-w-0 leading-none">
          <span
            className={[
              "block text-lg font-semibold tracking-[-0.035em]",
              inverse ? "text-white" : "text-navy",
            ].join(" ")}
          >
            DUCRISA
          </span>
          <span
            className={[
              "mt-1 block max-w-48 text-[9px] font-semibold uppercase leading-[1.25] tracking-[0.12em]",
              inverse ? "text-white/55" : "text-slate-500",
            ].join(" ")}
          >
            Criminology &amp; Security Studies
          </span>
        </span>
      ) : null}
    </Link>
  );
}
