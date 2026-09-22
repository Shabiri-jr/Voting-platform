"use client";

import { Alert } from "@/components/shared/Alert";
import { FormSubmit, SelectField, TextField } from "@/components/admin/FormFields";
import {
  type AdminFormAction,
  useAdminAction,
} from "@/components/admin/useAdminAction";

export type StudentFormValue = {
  id?: string;
  matricNumber?: string;
  firstName?: string;
  surname?: string;
  department?: string;
  level?: string;
  isEligible?: boolean;
};

type StudentFormProps = {
  action?: AdminFormAction;
  initialValue?: StudentFormValue;
  submitLabel?: string;
};

export function StudentForm({
  action,
  initialValue,
  submitLabel = "Save student",
}: StudentFormProps) {
  const [state, formAction, isPending] = useAdminAction(action);
  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      {state.message ? (
        <div className="md:col-span-2">
          <Alert title={state.message} tone={state.success ? "success" : "error"} />
        </div>
      ) : null}
      {initialValue?.id ? <input type="hidden" name="id" value={initialValue.id} /> : null}
      <TextField
        label="Matric number"
        name="matricNumber"
        defaultValue={initialValue?.matricNumber}
        placeholder="DU/CSC/2021/001"
        required
      />
      <TextField
        label="First name"
        name="firstName"
        defaultValue={initialValue?.firstName}
        required
      />
      <TextField
        label="Surname"
        name="surname"
        defaultValue={initialValue?.surname}
        required
      />
      <TextField
        label="Department"
        name="department"
        defaultValue={initialValue?.department}
        required
      />
      <SelectField
        label="Level"
        name="level"
        defaultValue={initialValue?.level}
        required
        options={["100L", "200L", "300L", "400L", "500L", "600L"].map(
          (level) => ({ value: level, label: level }),
        )}
      />
      <div className="space-y-2">
        <span className="block text-sm font-semibold text-navy">Eligibility</span>
        <label className="flex min-h-11 items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-sm text-navy">
          <input
            type="checkbox"
            name="isEligible"
            defaultChecked={initialValue?.isEligible ?? true}
            className="size-4 accent-accent"
          />
          Eligible to vote
        </label>
      </div>
      <div className="md:col-span-2">
        <FormSubmit disabled={isPending}>
          {isPending ? "Saving student" : submitLabel}
        </FormSubmit>
      </div>
    </form>
  );
}
