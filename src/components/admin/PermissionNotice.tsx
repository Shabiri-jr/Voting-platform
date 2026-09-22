import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr";

export function PermissionNotice() {
  return (
    <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
      <LockSimpleIcon className="mt-0.5 size-5 shrink-0" weight="fill" aria-hidden />
      <div>
        <p className="font-semibold">Read-only access</p>
        <p className="mt-1 leading-6 text-blue-900/75">
          Your viewer role can inspect dashboards and results but cannot modify
          election data.
        </p>
      </div>
    </div>
  );
}
