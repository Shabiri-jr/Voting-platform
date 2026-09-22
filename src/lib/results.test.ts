import { describe, expect, it } from "vitest";
import { rankResults } from "@/lib/results";
import type { ResultRow } from "@/types";

function row(candidateId: string, candidateName: string, voteCount: number): ResultRow {
  return {
    electionId: "election",
    electionTitle: "Election",
    positionId: "position",
    positionTitle: "President",
    positionOrder: 1,
    candidateId,
    candidateName,
    voteCount,
  };
}

describe("rankResults", () => {
  it("assigns competition ranks and identifies ties", () => {
    const results = rankResults([
      row("a", "Sayo Dabiri", 12),
      row("b", "Mary Okafor", 12),
      row("c", "Daniel Musa", 4),
    ]);
    expect(results.map(({ rank }) => rank)).toEqual([1, 1, 3]);
    expect(results[0].tied).toBe(true);
    expect(results[1].tied).toBe(true);
    expect(results[2].tied).toBe(false);
  });

  it("handles a zero-vote position", () => {
    const results = rankResults([row("a", "Sayo Dabiri", 0)]);
    expect(results[0].percentage).toBe(0);
    expect(results[0].rank).toBe(1);
  });
});
