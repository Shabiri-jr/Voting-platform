import type { NextRequest } from "next/server";
import { getAdminIdentity, requireRecentAdmin } from "@/lib/auth";
import { escapeCsvCell } from "@/lib/csv";
import { getAdminResults } from "@/lib/admin";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/audit";
import { uuidSchema } from "@/lib/validation";
import { hasValidOrigin } from "@/lib/security/origin";
import { rankResults } from "@/lib/results";
import { listElections } from "@/lib/admin";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return new Response("Forbidden", { status: 403 });
  const admin = await getAdminIdentity();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  try {
    await requireRecentAdmin("viewer");
  } catch {
    return new Response("Recent authentication required", { status: 401 });
  }
  const formData = await request.formData();
  const parsedId = uuidSchema.safeParse(formData.get("electionId"));
  if (!parsedId.success) return new Response("Invalid election", { status: 400 });

  const [rows, elections] = await Promise.all([
    getAdminResults(parsedId.data),
    listElections(),
  ]);
  const election = elections.find((item) => item.id === parsedId.data);
  if (!election) return new Response("Election not found", { status: 404 });
  const groups = rows.reduce<Map<string, typeof rows>>((current, row) => {
    const group = current.get(row.positionId) ?? [];
    group.push(row);
    current.set(row.positionId, group);
    return current;
  }, new Map());
  const lines = [
    ["election", escapeCsvCell(election.title)].join(","),
    ["election_id", election.id].join(","),
    ["status", election.status].join(","),
    ["generated_at", new Date().toISOString()].join(","),
    [],
    ["position", "rank", "candidate", "votes", "percentage"].join(","),
  ].map((line) => Array.isArray(line) ? line.join(",") : line);
  for (const positionRows of groups.values()) {
    rankResults(positionRows).forEach((row) => {
      lines.push(
        [
          escapeCsvCell(positionRows[0].positionTitle),
          row.rank,
          escapeCsvCell(row.candidateName),
          row.votes,
          row.percentage.toFixed(1),
        ].join(","),
      );
    });
  }

  const supabase = getSupabaseAdminClient();
  await writeAuditLog(supabase, admin, {
    action: "results_exported",
    details: "Exported aggregate election results as CSV.",
  });

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="campusvote-results.csv"',
      "Cache-Control": "no-store",
    },
  });
}
