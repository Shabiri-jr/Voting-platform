import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getBallotTokenHash: vi.fn(),
  clearBallotTokenCookie: vi.fn(),
  setBallotTokenCookie: vi.fn(),
  rpc: vi.fn(),
  rosterMaybeSingle: vi.fn(),
  isAutomatedRequest: vi.fn(),
}));

vi.mock("@/lib/security/ballot-token", () => ({
  clearBallotTokenCookie: mocks.clearBallotTokenCookie,
  createBallotToken: () => ({
    rawToken: "new-raw-token",
    tokenHash: "22".repeat(32),
  }),
  getBallotTokenHash: mocks.getBallotTokenHash,
  setBallotTokenCookie: mocks.setBallotTokenCookie,
}));

vi.mock("@/lib/security/origin", () => ({
  hasValidOrigin: () => true,
}));

vi.mock("@/lib/security/bot", () => ({
  isAutomatedRequest: mocks.isAutomatedRequest,
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => {
    const rosterQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: mocks.rosterMaybeSingle,
    };
    rosterQuery.select.mockReturnValue(rosterQuery);
    rosterQuery.eq.mockReturnValue(rosterQuery);

    const electionQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      lte: vi.fn(),
      gt: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(async () => ({
        data: [{ id: "20260000-0000-4000-8000-000000000001" }],
        error: null,
      })),
    };
    electionQuery.select.mockReturnValue(electionQuery);
    electionQuery.eq.mockReturnValue(electionQuery);
    electionQuery.lte.mockReturnValue(electionQuery);
    electionQuery.gt.mockReturnValue(electionQuery);
    electionQuery.order.mockReturnValue(electionQuery);

    return {
      from: vi.fn((table: string) =>
        table === "students" ? rosterQuery : electionQuery,
      ),
      rpc: mocks.rpc,
    };
  },
}));

import { POST } from "@/app/api/verify/route";

function verificationRequest() {
  return new NextRequest("http://localhost:3000/api/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
    },
    body: JSON.stringify({
      matricNumber: "DU9999",
      surname: "Unregistered",
    }),
  });
}

describe("student verification route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clearBallotTokenCookie.mockImplementation((response) => response);
    mocks.setBallotTokenCookie.mockImplementation((response) => response);
    mocks.isAutomatedRequest.mockResolvedValue(false);
    mocks.rosterMaybeSingle.mockResolvedValue({
      data: { surname: "Unregistered", is_eligible: true },
      error: null,
    });
  });

  it("rejects automated requests before accessing voter records", async () => {
    mocks.isAutomatedRequest.mockResolvedValue(true);

    const response = await POST(verificationRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.status).toBe("invalid");
    expect(mocks.getBallotTokenHash).not.toHaveBeenCalled();
    expect(mocks.rosterMaybeSingle).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a matric number that is absent from the student register", async () => {
    mocks.getBallotTokenHash.mockResolvedValue(null);
    mocks.rosterMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await POST(verificationRequest());
    const body = await response.json();

    expect(body.status).toBe("invalid");
    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "verify_student",
      expect.anything(),
    );
    expect(mocks.setBallotTokenCookie).not.toHaveBeenCalled();
  });

  it("does not trust an existing ballot cookie before checking identity", async () => {
    mocks.getBallotTokenHash.mockResolvedValue("11".repeat(32));
    mocks.rpc.mockImplementation(async (name: string) => {
      if (name === "verify_student") {
        return {
          data: [{ status: "not_found", expires_at: null }],
          error: null,
        };
      }
      return { data: null, error: null };
    });

    const response = await POST(verificationRequest());
    const body = await response.json();

    expect(body.status).toBe("invalid");
    expect(mocks.rpc).toHaveBeenCalledWith(
      "verify_student",
      expect.objectContaining({
        p_matric_number: "DU9999",
        p_surname: "Unregistered",
        p_token_hash_hex: "11".repeat(32),
      }),
    );
    expect(mocks.rpc).toHaveBeenCalledWith("expire_ballot_session", {
      p_token_hash_hex: "11".repeat(32),
    });
    expect(mocks.clearBallotTokenCookie).toHaveBeenCalledOnce();
    expect(mocks.setBallotTokenCookie).not.toHaveBeenCalled();
  });

  it("rejects malformed matric numbers before querying voter records", async () => {
    mocks.getBallotTokenHash.mockResolvedValue(null);

    const response = await POST(
      new NextRequest("http://localhost:3000/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          matricNumber: "NBBNM BB",
          surname: "wbnm",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.status).toBe("invalid");
    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "verify_student",
      expect.anything(),
    );
    expect(mocks.setBallotTokenCookie).not.toHaveBeenCalled();
  });

  it("resumes only when the database confirms the cookie matches the voter", async () => {
    mocks.getBallotTokenHash.mockResolvedValue("11".repeat(32));
    mocks.rpc.mockResolvedValue({
      data: [{ status: "verified", expires_at: "2026-06-15T08:00:00.000Z" }],
      error: null,
    });

    const response = await POST(verificationRequest());
    const body = await response.json();

    expect(body.status).toBe("verified");
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.clearBallotTokenCookie).not.toHaveBeenCalled();
    expect(mocks.setBallotTokenCookie).not.toHaveBeenCalled();
  });

  it("creates a new cookie only after database verification succeeds", async () => {
    mocks.getBallotTokenHash.mockResolvedValue(null);
    mocks.rpc.mockResolvedValue({
      data: [{ status: "verified", expires_at: "2026-06-15T08:00:00.000Z" }],
      error: null,
    });

    const response = await POST(verificationRequest());
    const body = await response.json();

    expect(body.status).toBe("verified");
    expect(mocks.rpc).toHaveBeenCalledWith(
      "verify_student",
      expect.objectContaining({ p_token_hash_hex: "22".repeat(32) }),
    );
    expect(mocks.setBallotTokenCookie).toHaveBeenCalledWith(
      expect.anything(),
      "new-raw-token",
      "2026-06-15T08:00:00.000Z",
    );
  });
});
