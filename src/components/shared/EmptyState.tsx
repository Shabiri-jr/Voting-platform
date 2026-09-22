import { TrayIcon } from "@phosphor-icons/react/dist/ssr";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed bg-white px-6 py-12 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-500">
          <TrayIcon className="size-6" aria-hidden />
        </span>
        <h3 className="mt-4 font-semibold text-navy">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
