import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminIdentity } from "@/types";

interface AuditInput {
  action: string;
  details: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export async function writeAuditLog(
  supabase: SupabaseClient,
  actor: AdminIdentity,
  input: AuditInput,
) {
  const { error } = await supabase.from("audit_logs").insert({
    admin_id: actor.adminId,
    action: input.action,
    details: input.details,
    metadata: input.metadata ?? {},
  });
  if (error) throw new Error("Could not record audit event");
}
