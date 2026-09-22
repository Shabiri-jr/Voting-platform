import type { NextRequest } from "next/server";
import { getServerEnv } from "@/lib/env";

export function hasValidOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const env = getServerEnv();
  const allowed = new Set<string>([new URL(env.NEXT_PUBLIC_APP_URL).origin]);
  for (const extraOrigin of env.ALLOWED_ORIGINS?.split(",") ?? []) {
    const trimmed = extraOrigin.trim();
    if (trimmed) allowed.add(new URL(trimmed).origin);
  }

  return allowed.has(origin);
}
