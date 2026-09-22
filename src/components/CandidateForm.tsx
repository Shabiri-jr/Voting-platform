"use client";

import { Alert } from "@/components/shared/Alert";
import {
  FormSubmit,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/FormFields";
import {
  type AdminFormAction,
  useAdminAction,
} from "@/components/admin/useAdminAction";

export type CandidateFormValue = {
  id?: string;
  positionId?: string;
  fullName?: string;
  department?: string;
  level?: string;
  photoUrl?: string | null;
  manifesto?: string | null;
};

type CandidateFormProps = {
  action?: AdminFormAction;
  positions: Array<{ id: string; title: string }>;
  initialValue?: CandidateFormValue;
  submitLabel?: string;
};

export function CandidateForm({
  action,
  positions,
  initialValue,
  submitLabel = "Save candidate",
}: CandidateFormProps) {
  const [state, formAction, isPending] = useAdminAction(action);
  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      {state.message ? (
        <div className="md:col-span-2">
          <Alert title={state.message} tone={state.success ? "success" : "error"} />
        </div>
      ) : null}
      {initialValue?.id ? <input type="hidden" name="id" value={initialValue.id} /> : null}
      <SelectField
        label="Election position"
        name="positionId"
        defaultValue={initialValue?.positionId}
        required
        options={positions.map((position) => ({
          value: position.id,
          label: position.title,
        }))}
      />
      <TextField
        label="Full name"
        name="fullName"
        defaultValue={initialValue?.fullName}
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
      <div className="space-y-2 md:col-span-2">
        <label htmlFor="photo" className="block text-sm font-semibold text-navy">
          Upload candidate photo
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full rounded-xl border bg-white p-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-2 file:font-semibold file:text-white"
        />
        <p className="text-xs leading-5 text-slate-500">
          JPEG, PNG, or WebP. Maximum 2 MB. A new upload overrides the URL above.
        </p>
      </div>
      <div className="md:col-span-2">
        <TextAreaField
          label="Manifesto"
          name="manifesto"
          defaultValue={initialValue?.manifesto}
          placeholder="Summarize the candidate's priorities."
        />
      </div>
      <div className="md:col-span-2">
        <FormSubmit disabled={isPending}>
          {isPending ? "Saving candidate" : submitLabel}
        </FormSubmit>
      </div>
    </form>
  );
}
