import { describe, expect, it } from "vitest";
import { voteRequestSchema } from "@/lib/validation";

const positionId = "11111111-1111-4111-8111-111111111111";
const candidateId = "22222222-2222-4222-8222-222222222222";

describe("voteRequestSchema", () => {
  it("rejects two candidates for one position", () => {
    const result = voteRequestSchema.safeParse({
      selections: [
        { positionId, candidateId },
        {
          positionId,
          candidateId: "33333333-3333-4333-8333-333333333333",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("accepts one candidate per distinct position", () => {
    const result = voteRequestSchema.safeParse({
      selections: [{ positionId, candidateId }],
    });
    expect(result.success).toBe(true);
  });
});
