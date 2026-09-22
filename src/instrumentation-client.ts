import { initBotId } from "botid/client/core";

const basicCheck = {
  checkLevel: "basic" as const,
};

initBotId({
  protect: [
    {
      path: "/api/verify",
      method: "POST",
      advancedOptions: basicCheck,
    },
    {
      path: "/api/admin/login",
      method: "POST",
      advancedOptions: basicCheck,
    },
  ],
});
