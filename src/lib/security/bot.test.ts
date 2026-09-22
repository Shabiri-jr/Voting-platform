import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkBotId: vi.fn(),
}));

vi.mock("botid/server", () => ({
  checkBotId: mocks.checkBotId,
}));

import { isAutomatedRequest } from "@/lib/security/bot";

describe("BotID request classification", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("reports requests classified as bots", async () => {
    mocks.checkBotId.mockResolvedValue({ isBot: true });

    await expect(isAutomatedRequest()).resolves.toBe(true);
    expect(mocks.checkBotId).toHaveBeenCalledWith({
      advancedOptions: {
        checkLevel: "basic",
      },
    });
  });

  it("fails closed in production when classification is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.checkBotId.mockRejectedValue(new Error("BotID unavailable"));

    await expect(isAutomatedRequest()).resolves.toBe(true);
  });
});
