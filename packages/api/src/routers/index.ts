import { protectedProcedure, publicProcedure, router } from "../index";
import { attemptRouter } from "./attempt";
import { disputeRouter } from "./dispute";
import { disputeAdminRouter } from "./dispute-admin";
import { forecastRouter } from "./forecast";
import { forecastAdminRouter } from "./forecast-admin";
import { privacyRouter } from "./privacy";
import { profileRouter } from "./profile";
import { quotaRouter } from "./quota";
import { scoringRouter } from "./scoring";

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
  profile: profileRouter,
  quota: quotaRouter,
  dispute: disputeRouter,
  disputeAdmin: disputeAdminRouter,
  forecast: forecastRouter,
  forecastAdmin: forecastAdminRouter,
  scoring: scoringRouter,
});
export type AppRouter = typeof appRouter;
