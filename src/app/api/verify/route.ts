import type { NextRequest } from "next/server";
import {
  clearBallotTokenCookie,
  createBallotToken,
  getBallotTokenHash,
  setBallotTokenCookie,
} from "@/lib/security/ballot-token";
import { isAutomatedRequest } from "@/lib/security/bot";
import { noStoreJson, readBoundedJson } from "@/lib/security/http";
import { hasValidOrigin } from "@/lib/security/origin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyRequestSchema } from "@/lib/validation";
import type { VerifyResponse } from "@/types";

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

async function revokeExistingSession(
  supabase: AdminClient,
  tokenHash: string | null,
) {
  if (!tokenHash) return;
  await supabase.rpc("expire_ballot_session", {
    p_token_hash_hex: tokenHash,
  });
}

function normalizeSurname(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en");
}

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return noStoreJson<VerifyResponse>(
      { status: "invalid", message: "Request could not be verified." },
      { status: 403 },
    );
  }
  if (await isAutomatedRequest()) {
    return noStoreJson<VerifyResponse>(
      { status: "invalid", message: "Request could not be verified." },
      { status: 403 },
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const existingTokenHash = await getBallotTokenHash();
    const parsed = verifyRequestSchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) {
      await revokeExistingSession(supabase, existingTokenHash);
      return clearBallotTokenCookie(noStoreJson<VerifyResponse>(
        { status: "invalid", message: "Enter a valid matric number and surname." },
        { status: 400 },
      ));
    }

    const { data: rosterStudent, error: rosterError } = await supabase
      .from("students")
      .select("surname, is_eligible")
      .eq("matric_number", parsed.data.matricNumber)
      .maybeSingle();

    if (rosterError) {
      return noStoreJson<VerifyResponse>(
        {
          status: "invalid",
          message: "Something went wrong. Please contact the election officer.",
        },
        { status: 500 },
      );
    }

    if (
      !rosterStudent ||
      normalizeSurname(rosterStudent.surname) !==
        normalizeSurname(parsed.data.surname)
    ) {
      await revokeExistingSession(supabase, existingTokenHash);
      const response = noStoreJson<VerifyResponse>({
        status: "invalid",
        message: "Your details could not be verified.",
      });
      return existingTokenHash
        ? clearBallotTokenCookie(response)
        : response;
    }

    if (!rosterStudent.is_eligible) {
      await revokeExistingSession(supabase, existingTokenHash);
      const response = noStoreJson<VerifyResponse>({
        status: "not_eligible",
      });
      return existingTokenHash
        ? clearBallotTokenCookie(response)
        : response;
    }

    const { data: openElections, error: openElectionError } = await supabase
      .from("elections")
      .select("id")
      .eq("status", "open")
      .lte("start_time", new Date().toISOString())
      .gt("end_time", new Date().toISOString())
      .order("start_time", { ascending: false })
      .limit(1);

    if (openElectionError || !openElections?.[0]) {
      await revokeExistingSession(supabase, existingTokenHash);
      return existingTokenHash
        ? clearBallotTokenCookie(
            noStoreJson<VerifyResponse>({ status: "closed" }),
          )
        : noStoreJson<VerifyResponse>({ status: "closed" });
    }

    const newToken = existingTokenHash ? null : createBallotToken();
    const { data, error } = await supabase.rpc("verify_student", {
      p_election_id: openElections[0].id,
      p_matric_number: parsed.data.matricNumber,
      p_surname: parsed.data.surname,
      p_token_hash_hex: existingTokenHash ?? newToken!.tokenHash,
    });

    if (error || !data?.[0]) {
      return noStoreJson<VerifyResponse>(
        {
          status: "invalid",
          message: "Something went wrong. Please contact the election officer.",
        },
        { status: 500 },
      );
    }

    const result = data[0] as {
      status:
        | "verified"
        | "not_found"
        | "details_mismatch"
        | "not_eligible"
        | "already_voted"
        | "session_active"
        | "election_unavailable";
      expires_at: string | null;
    };

    if (result.status === "verified" && result.expires_at) {
      if (newToken) {
        return setBallotTokenCookie(
          noStoreJson<VerifyResponse>({ status: "verified" }),
          newToken.rawToken,
          result.expires_at,
        );
      }
      return noStoreJson<VerifyResponse>({ status: "verified" });
    }
    if (result.status === "already_voted") {
      await revokeExistingSession(supabase, existingTokenHash);
      return existingTokenHash
        ? clearBallotTokenCookie(
            noStoreJson<VerifyResponse>({ status: "already_voted" }),
          )
        : noStoreJson<VerifyResponse>({ status: "already_voted" });
    }
    if (result.status === "election_unavailable") {
      await revokeExistingSession(supabase, existingTokenHash);
      return existingTokenHash
        ? clearBallotTokenCookie(
            noStoreJson<VerifyResponse>({ status: "closed" }),
          )
        : noStoreJson<VerifyResponse>({ status: "closed" });
    }
    await revokeExistingSession(supabase, existingTokenHash);
    const response = noStoreJson<VerifyResponse>({
      status: "invalid",
      message:
        result.status === "session_active"
          ? "A voting session is already active. Continue on the original device or wait for it to expire."
          : "Your details could not be verified.",
    });
    return existingTokenHash
      ? clearBallotTokenCookie(response)
      : response;
  } catch {
    return noStoreJson<VerifyResponse>(
      {
        status: "invalid",
        message: "Something went wrong. Please contact the election officer.",
      },
      { status: 500 },
    );
  }
}
