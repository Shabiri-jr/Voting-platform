export type VerifyStatus =
  | "verified"
  | "not_found"
  | "not_eligible"
  | "already_voted"
  | "closed"
  | "invalid";

export interface VerifyResponse {
  status: VerifyStatus;
  message?: string;
}

export interface BallotCandidate {
  id: string;
  fullName: string;
  department: string;
  level: string;
  photoUrl?: string;
  manifesto?: string;
}

export interface BallotPosition {
  id: string;
  title: string;
  description?: string;
  displayOrder: number;
  required: true;
  candidates: BallotCandidate[];
}

export interface BallotResponse {
  election: {
    id: string;
    title: string;
    description?: string;
  };
  positions: BallotPosition[];
}

export type VoteStatus =
  | "success"
  | "already_voted"
  | "closed"
  | "expired"
  | "invalid";

export interface VoteResponse {
  status: VoteStatus;
  message?: string;
}

export type AdminRole = "viewer" | "election_officer" | "super_admin";
export type ElectionStatus = "pending" | "open" | "paused" | "closed";

export interface ActionResult<T = undefined> {
  success: boolean;
  data?: T;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}
