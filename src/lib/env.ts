import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.url(),
  ALLOWED_ORIGINS: z.string().optional(),
  REQUIRE_ADMIN_MFA: z
    .enum(["true", "false"])
    .default(process.env.NODE_ENV === "production" ? "true" : "false"),
});

let publicEnv: z.infer<typeof publicEnvSchema> | undefined;
let serverEnv: z.infer<typeof serverEnvSchema> | undefined;

export function getPublicEnv() {
  publicEnv ??= publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return publicEnv;
}

export function getServerEnv() {
  serverEnv ??= serverEnvSchema.parse({
    ...getPublicEnv(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    REQUIRE_ADMIN_MFA: process.env.REQUIRE_ADMIN_MFA,
  });
  return serverEnv;
}
