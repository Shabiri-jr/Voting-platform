"use client";

import { Alert } from "@/components/shared/Alert";
import {
  FormSubmit,
  TextAreaField,
  TextField,
} from "@/components/admin/FormFields";
import {
  type AdminFormAction,
  useAdminAction,
} from "@/components/admin/useAdminAction";

export type PositionFormValue = {
  id?: string;
  electionId?: string;
  title?: string;
  description?: string | null;
  displayOrder?: number;
};

type PositionFormProps = {
  action?: AdminFormAction;
  electionId: string;
  initialValue?: PositionFormValue;
  submitLabel?: string;
};

export function PositionForm({
  action,
  electionId,
  initialValue,
  submitLabel = "Save position",
}: PositionFormProps) {
  const [state, formAction, isPending] = useAdminAction(action);
  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      {state.message ? (
        <div className="md:col-span-2">
          <Alert title={state.message} tone={state.success ? "success" : "error"} />
        </div>
      ) : null}
      <input type="hidden" name="electionId" value={electionId} />
      {initialValue?.id ? <input type="hidden" name="id" value={initialValue.id} /> : null}
      <TextField
        label="Position title"
        name="title"
        defaultValue={initialValue?.title}
        required
      />
      <TextField
        label="Display order"
        name="displayOrder"
        type="number"
        defaultValue={initialValue?.displayOrder ?? 1}
        required
      />
      <div className="md:col-span-2">
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={initialValue?.description}
          placeholder="Explain the office and voting instruction."
        />
      </div>
      <div className="md:col-span-2">
        <FormSubmit disabled={isPending}>
          {isPending ? "Saving position" : submitLabel}
        </FormSubmit>
      </div>
    </form>
  );
}
