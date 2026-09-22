import "server-only";

import { cache } from "react";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CandidateRecord,
  ElectionRecord,
  PositionRecord,
  ResultRow,
  StudentRecord,
} from "@/types";

const getAdminQueryClient = cache(async () => {
  await requireAdmin();
  return createSupabaseServerClient();
});

async function closeExpiredElections() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("elections")
    .update({ status: "closed" })
    .eq("status", "open")
    .lte("end_time", new Date().toISOString())
    .select("id, title, end_time");

  if (error) throw new Error("Could not synchronize election status");
  if (!data?.length) return;

  const { error: auditError } = await supabase.from("audit_logs").insert(
    data.map((election) => ({
      admin_id: null,
      action: "election_auto_closed",
      details: `Automatically closed ${String(election.title)} after its scheduled end time.`,
      metadata: {
        electionId: String(election.id),
        scheduledEndTime: String(election.end_time),
      },
    })),
  );

  if (auditError) {
    console.error("[elections] automatic closure audit failed", {
      electionIds: data.map((election) => String(election.id)),
      error: auditError.message,
    });
  }
}

export async function listStudents(electionId?: string): Promise<StudentRecord[]> {
  const supabase = await getAdminQueryClient();
  const [studentResult, participationResult] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, matric_number, first_name, surname, department, level, is_eligible, created_at",
      )
      .order("matric_number"),
    electionId
      ? supabase
          .from("voter_election_status")
          .select("student_id, voted_at")
          .eq("election_id", electionId)
          .eq("has_voted", true)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const { data, error } = studentResult;
  if (error) throw new Error("Could not load students");
  if (participationResult.error) throw new Error("Could not load voting status");
  const participation = new Map(
    (participationResult.data ?? []).map((row) => [String(row.student_id), row]),
  );

  return (data ?? []).map((student) => {
    const votingStatus = participation.get(String(student.id));

    return {
      id: String(student.id),
      matricNumber: String(student.matric_number),
      firstName: String(student.first_name),
      surname: String(student.surname),
      department: String(student.department),
      level: String(student.level),
      isEligible: Boolean(student.is_eligible),
      hasVoted: Boolean(votingStatus),
      votedAt: votingStatus?.voted_at ? String(votingStatus.voted_at) : null,
      createdAt: String(student.created_at),
    };
  });
}

export async function listElections(): Promise<ElectionRecord[]> {
  const supabase = await getAdminQueryClient();
  await closeExpiredElections();
  const { data, error } = await supabase
    .from("elections")
    .select("id, title, description, status, start_time, end_time, created_at")
    .order("start_time", { ascending: false });
  if (error) throw new Error("Could not load elections");

  return (data ?? []).map((election) => ({
    id: String(election.id),
    title: String(election.title),
    description: String(election.description),
    status: election.status as ElectionRecord["status"],
    startTime: String(election.start_time),
    endTime: String(election.end_time),
    createdAt: String(election.created_at),
  }));
}

export async function getPrimaryElection() {
  const elections = await listElections();
  return (
    elections.find((election) => election.status === "open") ??
    elections.find((election) => election.status === "pending") ??
    elections[0] ??
    null
  );
}

export async function getElectionContext(requestedElectionId?: string) {
  const elections = await listElections();
  const election =
    elections.find((item) => item.id === requestedElectionId) ??
    elections.find((item) => item.status === "open") ??
    elections.find((item) => item.status === "pending") ??
    elections[0] ??
    null;

  return { elections, election };
}

export async function listPositions(electionId: string): Promise<PositionRecord[]> {
  const supabase = await getAdminQueryClient();
  const { data, error } = await supabase
    .from("positions")
    .select("id, election_id, title, description, display_order, created_at")
    .eq("election_id", electionId)
    .order("display_order");
  if (error) throw new Error("Could not load positions");
  return (data ?? []).map((position) => ({
    id: String(position.id),
    electionId: String(position.election_id),
    title: String(position.title),
    description: String(position.description),
    displayOrder: Number(position.display_order),
    createdAt: String(position.created_at),
  }));
}

export async function listCandidates(electionId: string): Promise<CandidateRecord[]> {
  const supabase = await getAdminQueryClient();
  const { data, error } = await supabase
    .from("candidates")
    .select(
      "id, position_id, full_name, department, level, photo_url, manifesto, created_at, positions!inner(election_id)",
    )
    .eq("positions.election_id", electionId)
    .order("full_name");
  if (error) throw new Error("Could not load candidates");
  return (data ?? []).map((candidate) => ({
    id: String(candidate.id),
    positionId: String(candidate.position_id),
    fullName: String(candidate.full_name),
    department: String(candidate.department),
    level: String(candidate.level),
    photoUrl: candidate.photo_url ? String(candidate.photo_url) : null,
    manifesto: String(candidate.manifesto),
    createdAt: String(candidate.created_at),
  }));
}

export async function getAdminDashboard(electionId: string) {
  const supabase = await getAdminQueryClient();
  const { data, error } = await supabase.rpc("admin_dashboard", {
    p_election_id: electionId,
  });
  if (error) throw new Error("Could not load dashboard");
  return data as {
    registeredStudents: number;
    eligibleStudents: number;
    studentsVoted: number;
    studentsNotVoted: number;
    ballotsCast: number;
    totalCandidates: number;
    totalPositions: number;
    turnoutPercentage: number;
  };
}

export async function getAdminResults(
  electionId: string,
): Promise<ResultRow[]> {
  const supabase = await getAdminQueryClient();
  const { data, error } = await supabase.rpc("admin_results", {
    p_election_id: electionId,
  });
  if (error) throw new Error("Could not load results");

  return (data ?? []).map((row: Record<string, unknown>) => ({
    electionId: String(row.election_id),
    electionTitle: String(row.election_title),
    positionId: String(row.position_id),
    positionTitle: String(row.position_title),
    positionOrder: Number(row.position_order),
    candidateId: String(row.candidate_id),
    candidateName: String(row.candidate_name),
    voteCount: Number(row.vote_count),
  }));
}

export async function getDepartmentTurnout(electionId: string) {
  const supabase = await getAdminQueryClient();
  const [studentsResult, participationResult] = await Promise.all([
    supabase.from("students").select("id, department, is_eligible"),
    supabase
      .from("voter_election_status")
      .select("student_id")
      .eq("election_id", electionId)
      .eq("has_voted", true),
  ]);
  if (studentsResult.error || participationResult.error) {
    throw new Error("Could not load department turnout");
  }
  const votedIds = new Set(
    (participationResult.data ?? []).map((row) => String(row.student_id)),
  );

  const groups = new Map<string, { eligible: number; voted: number }>();
  for (const student of studentsResult.data ?? []) {
    const current = groups.get(String(student.department)) ?? {
      eligible: 0,
      voted: 0,
    };
    if (student.is_eligible) current.eligible += 1;
    if (student.is_eligible && votedIds.has(String(student.id))) current.voted += 1;
    groups.set(String(student.department), current);
  }
  return [...groups.entries()]
    .map(([department, totals]) => ({ department, ...totals }))
    .sort((a, b) => a.department.localeCompare(b.department));
}

export async function listAuditLogs() {
  const supabase = await getAdminQueryClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, details, created_at, admins(full_name)")
    .order("created_at", { ascending: false })
    .limit(250);
  if (error) throw new Error("Could not load audit logs");
  return (data ?? []).map((entry) => {
    const relation = entry.admins as unknown as { full_name?: string } | null;
    return {
      id: String(entry.id),
      adminName: relation?.full_name ?? "System",
      action: String(entry.action),
      details: String(entry.details),
      createdAt: String(entry.created_at),
    };
  });
}
