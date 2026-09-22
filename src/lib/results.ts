import type { ResultRow } from "@/types";

export type RankedResult = {
  candidateId: string;
  candidateName: string;
  votes: number;
  percentage: number;
  rank: number;
  tied: boolean;
};

export function rankResults(rows: ResultRow[]): RankedResult[] {
  const total = rows.reduce((sum, row) => sum + row.voteCount, 0);
  const sorted = [...rows].sort(
    (a, b) => b.voteCount - a.voteCount || a.candidateName.localeCompare(b.candidateName),
  );
  const rankByVotes = new Map<number, number>();
  return sorted.map((row, index) => {
    if (!rankByVotes.has(row.voteCount)) rankByVotes.set(row.voteCount, index + 1);
    const rank = rankByVotes.get(row.voteCount) ?? index + 1;
    const tied = sorted.some(
      (candidate) =>
        candidate.candidateId !== row.candidateId &&
        candidate.voteCount === row.voteCount,
    );
    return {
      candidateId: row.candidateId,
      candidateName: row.candidateName,
      votes: row.voteCount,
      percentage: total ? (row.voteCount / total) * 100 : 0,
      rank,
      tied,
    };
  });
}
