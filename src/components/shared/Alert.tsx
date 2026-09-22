import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

type AlertProps = {
  title: string;
  children?: React.ReactNode;
  tone?: "info" | "success" | "error" | "warning";
};

const tones = {
  info: {
    icon: InfoIcon,
    classes: "border-blue-200 bg-blue-50 text-blue-950",
  },
  success: {
    icon: CheckCircleIcon,
    classes: "border-brand-200 bg-brand-50 text-brand-950",
  },
  error: {
    icon: WarningCircleIcon,
    classes: "border-red-200 bg-red-50 text-red-950",
  },
  warning: {
    icon: WarningCircleIcon,
    classes: "border-amber-200 bg-amber-50 text-amber-950",
  },
};

export function Alert({ title, children, tone = "info" }: AlertProps) {
  const { icon: Icon, classes } = tones[tone];

  return (
    <div
      className={`flex gap-3 rounded-xl border p-4 text-sm ${classes}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 size-5 shrink-0" weight="fill" aria-hidden />
      <div>
        <p className="font-semibold">{title}</p>
        {children ? <div className="mt-1 leading-6 opacity-80">{children}</div> : null}
      </div>
    </div>
  );
}
