import { protectedProcedure, publicProcedure, router } from "../index";
import { attemptRouter } from "./attempt";
import { privacyRouter } from "./privacy";
import { forecastRouter } from "./forecast";
import { forecastAdminRouter } from "./forecast-admin";
export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  attempt: attemptRouter,
  privacy: privacyRouter,
  forecast: forecastRouter,
  forecastAdmin: forecastAdminRouter,
});
export type AppRouter = typeof appRouter;
