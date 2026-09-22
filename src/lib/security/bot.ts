import { checkBotId } from "botid/server";

export async function isAutomatedRequest() {
  try {
    const result = await checkBotId({
      advancedOptions: {
        checkLevel: "basic",
      },
    });
    return result.isBot;
  } catch (error) {
    console.error("[botid] request classification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return process.env.NODE_ENV === "production";
  }
}
