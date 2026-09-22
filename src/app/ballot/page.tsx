import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BallotClient } from "@/components/student/BallotClient";
import { StudentShell } from "@/components/student/StudentShell";
import { getBallotTokenHash } from "@/lib/security/ballot-token";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Official ballot",
};

export const dynamic = "force-dynamic";

export default async function BallotPage() {
  const tokenHash = await getBallotTokenHash();
  if (!tokenHash) {
    redirect("/verify");
  }

  const { data, error } = await getSupabaseAdminClient().rpc(
    "get_ballot_session",
    { p_token_hash_hex: tokenHash },
  );
  if (error || !data) {
    redirect("/verify");
  }

  return (
    <StudentShell step="Step 2 of 3">
      <BallotClient />
    </StudentShell>
  );
}
