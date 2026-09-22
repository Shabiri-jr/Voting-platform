type ResourcePanelProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function ResourcePanel({
  title,
  description,
  children,
  defaultOpen = false,
}: ResourcePanelProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border bg-white p-5 sm:p-6"
    >
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-navy">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
          <span className="text-xl text-slate-400 transition group-open:rotate-45" aria-hidden>
            +
          </span>
        </div>
      </summary>
      <div className="mt-6 border-t pt-6">{children}</div>
    </details>
  );
}
