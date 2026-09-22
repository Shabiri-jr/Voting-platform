"use client";

import { UploadSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Alert } from "@/components/shared/Alert";
import {
  type AdminFormAction,
  useAdminAction,
} from "@/components/admin/useAdminAction";

type CsvUploadFormProps = {
  action?: AdminFormAction;
};

export function CsvUploadForm({ action }: CsvUploadFormProps) {
  const [state, formAction, isPending] = useAdminAction(action);
  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <Alert title={state.message} tone={state.success ? "success" : "error"} />
      ) : null}
      <label className="block rounded-2xl border border-dashed bg-slate-50 p-6 text-center transition hover:border-slate-400">
        <UploadSimpleIcon className="mx-auto size-7 text-accent" aria-hidden />
        <span className="mt-3 block text-sm font-semibold text-navy">
          Choose a student CSV file
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          Required columns: matric_number, first_name, surname, department, level
        </span>
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          required
          className="mx-auto mt-4 block max-w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-2 file:font-semibold file:text-white"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="min-h-11 rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-strong disabled:opacity-60"
      >
        {isPending ? "Validating roster" : "Validate and import"}
      </button>
    </form>
  );
}
