import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  isAutomatedRequest: vi.fn(async () => true),
  createSupabaseServerClient: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/security/origin", () => ({
  hasValidOrigin: () => true,
}));

vi.mock("@/lib/security/bot", () => ({
  isAutomatedRequest: mocks.isAutomatedRequest,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: mocks.getSupabaseAdminClient,
}));

import { POST } from "@/app/api/admin/login/route";

describe("admin login route", () => {
  it("rejects automated requests before calling authentication services", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "password",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
    expect(mocks.getSupabaseAdminClient).not.toHaveBeenCalled();
  });
});
