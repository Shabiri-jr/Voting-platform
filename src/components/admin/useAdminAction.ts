"use client";

import { useActionState } from "react";
import type { ActionResult } from "@/types";

export type AdminFormAction = (
  formData: FormData,
) => Promise<ActionResult<unknown>>;

const initialState: ActionResult<unknown> = { success: false };

export function useAdminAction(action?: AdminFormAction) {
  return useActionState<ActionResult<unknown>, FormData>(
    async (_previous, formData) => {
      if (!action) {
        return { success: false, message: "This action is unavailable." };
      }
      return action(formData);
    },
    initialState,
  );
}
