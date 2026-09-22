import type { AdminRole, ElectionStatus } from "@/types/api";

export interface AdminIdentity {
  userId: string;
  adminId: string;
  role: AdminRole;
  displayName: string;
  email: string;
}

export interface StudentRecord {
  id: string;
  matricNumber: string;
  firstName: string;
  surname: string;
  department: string;
  level: string;
  isEligible: boolean;
  hasVoted: boolean;
  votedAt: string | null;
  createdAt: string;
}

export interface ElectionRecord {
  id: string;
  title: string;
  description: string;
  status: ElectionStatus;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface PositionRecord {
  id: string;
  electionId: string;
  title: string;
  description: string;
  displayOrder: number;
  createdAt: string;
}

export interface CandidateRecord {
  id: string;
  positionId: string;
  fullName: string;
  department: string;
  level: string;
  photoUrl: string | null;
  manifesto: string;
  createdAt: string;
}

export interface ResultRow {
  electionId: string;
  electionTitle: string;
  positionId: string;
  positionTitle: string;
  positionOrder: number;
  candidateId: string;
  candidateName: string;
  voteCount: number;
}
