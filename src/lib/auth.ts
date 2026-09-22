import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import type { AdminIdentity, AdminRole } from "@/types";

const roleRank: Record<AdminRole, number> = {
  viewer: 1,
  election_officer: 2,
  super_admin: 3,
};

export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const supabase = await createSupabaseServerClient();
  const [{ data: userData, error: userError }, { data: claimsData }] =
    await Promise.all([supabase.auth.getUser(), supabase.auth.getClaims()]);
  const user = userData.user;

  if (userError || !user) return null;
  const claims = claimsData?.claims as Record<string, unknown> | undefined;
  if (getServerEnv().REQUIRE_ADMIN_MFA === "true" && claims?.aal !== "aal2") {
    return null;
  }

  const { data, error } = await supabase
    .from("admins")
    .select("id, auth_user_id, role, full_name, email, active")
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;

  return {
    userId: data.auth_user_id as string,
    adminId: data.id as string,
    role: data.role as AdminRole,
    displayName: data.full_name as string,
    email: data.email as string,
  };
}

export async function requireRecentAdmin(
  minimumRole: AdminRole = "viewer",
  maxAgeSeconds = 15 * 60,
) {
  const identity = await requireAdmin(minimumRole);
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedInAt = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).getTime() / 1000
    : 0;
  if (!signedInAt || Date.now() / 1000 - signedInAt > maxAgeSeconds) {
    throw new AuthorizationError("Recent authentication required");
  }
  return identity;
}

export async function requireAdmin(
  minimumRole: AdminRole = "viewer",
): Promise<AdminIdentity> {
  const identity = await getAdminIdentity();
  if (!identity || roleRank[identity.role] < roleRank[minimumRole]) {
    throw new AuthorizationError();
  }
  return identity;
}

export async function guardAdminPage(minimumRole: AdminRole = "viewer") {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/admin/login");
  if (roleRank[identity.role] < roleRank[minimumRole]) redirect("/admin");
  return identity;
}
