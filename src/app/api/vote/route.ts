import type { NextRequest } from "next/server";
import {
  clearBallotTokenCookie,
  getBallotTokenHash,
} from "@/lib/security/ballot-token";
import { noStoreJson, readBoundedJson } from "@/lib/security/http";
import { hasValidOrigin } from "@/lib/security/origin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { voteRequestSchema } from "@/lib/validation";
import type { VoteResponse } from "@/types";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return noStoreJson<VoteResponse>({ status: "invalid" }, { status: 403 });
  }

  const tokenHash = await getBallotTokenHash();
  if (!tokenHash) {
    return noStoreJson<VoteResponse>({ status: "expired" }, { status: 401 });
  }

  try {
    const parsed = voteRequestSchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) {
      return noStoreJson<VoteResponse>(
        {
          status: "invalid",
          message: "Please select one candidate for each required position.",
        },
        { status: 400 },
      );
    }

    const { data, error } = await getSupabaseAdminClient().rpc("cast_ballot", {
      p_token_hash_hex: tokenHash,
      p_selections: parsed.data.selections,
    });
    if (error || !data?.[0]) {
      return noStoreJson<VoteResponse>(
        {
          status: "invalid",
          message: "Vote submission could not be completed.",
        },
        { status: 500 },
      );
    }

    const status = String(data[0].status);
    if (status === "accepted" || status === "already_accepted") {
      return clearBallotTokenCookie(
        noStoreJson<VoteResponse>({ status: "success" }),
      );
    }
    if (status === "already_voted") {
      return clearBallotTokenCookie(
        noStoreJson<VoteResponse>({ status: "already_voted" }),
      );
    }
    if (status === "election_unavailable") {
      return noStoreJson<VoteResponse>({ status: "closed" });
    }
    if (status === "expired" || status === "invalid_session") {
      return clearBallotTokenCookie(
        noStoreJson<VoteResponse>({ status: "expired" }),
      );
    }
    return noStoreJson<VoteResponse>(
      {
        status: "invalid",
        message: "Please select one candidate for each required position.",
      },
      { status: 400 },
    );
  } catch {
    return noStoreJson<VoteResponse>(
      {
        status: "invalid",
        message: "Something went wrong. Please contact the election officer.",
      },
      { status: 500 },
    );
  }
}
