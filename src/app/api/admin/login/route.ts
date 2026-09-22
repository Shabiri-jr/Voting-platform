import type { NextRequest } from "next/server";
import { isAutomatedRequest } from "@/lib/security/bot";
import { noStoreJson, readBoundedJson } from "@/lib/security/http";
import { hasValidOrigin } from "@/lib/security/origin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";
import { getServerEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return noStoreJson({ success: false, message: "Request rejected." }, { status: 403 });
  }
  if (await isAutomatedRequest()) {
    return noStoreJson(
      { success: false, message: "Request rejected." },
      { status: 403 },
    );
  }

  try {
    const parsed = loginSchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) {
      return noStoreJson(
        { success: false, message: "Enter a valid email and password." },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) {
      return noStoreJson(
        { success: false, message: "Email or password is incorrect." },
        { status: 401 },
      );
    }

    const adminClient = getSupabaseAdminClient();
    const { data: admin } = await adminClient
      .from("admins")
      .select("id, active")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();
    if (!admin?.active) {
      await supabase.auth.signOut();
      return noStoreJson(
        { success: false, message: "This account is not authorized." },
        { status: 403 },
      );
    }
    if (getServerEnv().REQUIRE_ADMIN_MFA === "true") {
      const { data: claimsData } = await supabase.auth.getClaims();
      const claims = claimsData?.claims as Record<string, unknown> | undefined;
      if (claims?.aal !== "aal2") {
        await supabase.auth.signOut();
        return noStoreJson(
          {
            success: false,
            message: "Multi-factor authentication is required for administrators.",
          },
          { status: 403 },
        );
      }
    }

    await adminClient.from("audit_logs").insert({
      admin_id: admin.id,
      action: "admin_login",
      details: "Administrator signed in.",
    });
    return noStoreJson({ success: true });
  } catch {
    return noStoreJson(
      { success: false, message: "Login is temporarily unavailable." },
      { status: 500 },
    );
  }
}
