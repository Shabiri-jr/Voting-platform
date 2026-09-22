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

type ElectionSettingsFormProps = {
  action?: AdminFormAction;
  election?: {
    id: string;
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
    status: "pending" | "open" | "paused" | "closed";
  };
};

export function ElectionSettingsForm({
  action,
  election,
}: ElectionSettingsFormProps) {
  const [state, formAction, isPending] = useAdminAction(action);
  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      {state.message ? (
        <div className="md:col-span-2">
          <Alert title={state.message} tone={state.success ? "success" : "error"} />
        </div>
      ) : null}
      {election ? <input type="hidden" name="id" value={election.id} /> : null}
      <div className="md:col-span-2">
        <TextField
          label="Election title"
          name="title"
          defaultValue={election?.title}
          required
        />
      </div>
      <div className="md:col-span-2">
        <TextAreaField
          label="Description"
          name="description"
          defaultValue={election?.description}
        />
      </div>
      <TextField
        label="Start time"
        name="startTime"
        type="datetime-local"
        defaultValue={election?.startTime}
        required
        help="Africa/Lagos time (WAT, UTC+1)."
      />
      <TextField
        label="End time"
        name="endTime"
        type="datetime-local"
        defaultValue={election?.endTime}
        required
        help="Africa/Lagos time (WAT, UTC+1)."
      />
      <div className="self-end">
        <FormSubmit disabled={isPending}>
          {isPending
            ? "Saving election"
            : election
              ? "Update election"
              : "Create election"}
        </FormSubmit>
      </div>
    </form>
  );
}
