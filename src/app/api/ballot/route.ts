import { clearBallotTokenCookie, getBallotTokenHash } from "@/lib/security/ballot-token";
import { noStoreJson } from "@/lib/security/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BallotResponse } from "@/types";

export async function GET() {
  const tokenHash = await getBallotTokenHash();
  if (!tokenHash) {
    return noStoreJson({ message: "Voting session required." }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdminClient().rpc(
    "get_ballot_session",
    { p_token_hash_hex: tokenHash },
  );
  if (error || !data) {
    return clearBallotTokenCookie(
      noStoreJson({ message: "Voting session expired." }, { status: 401 }),
    );
  }

  const payload = data as BallotResponse;
  return noStoreJson<BallotResponse>({
    ...payload,
    positions: payload.positions.map((position) => ({
      ...position,
      required: true,
    })),
  });
}
