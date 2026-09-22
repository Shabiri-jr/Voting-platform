import { NextResponse, type NextRequest } from "next/server";
import { hasValidOrigin } from "@/lib/security/origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
