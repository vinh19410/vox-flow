import { protectedProcedure, router } from "../index";
import { getQuotaStatus } from "../quota/quota";

export const quotaRouter = router({
  status: protectedProcedure.query(({ ctx }) =>
    getQuotaStatus(ctx.db, ctx.session.user.id, ctx.env, {
      now: ctx.now?.(),
      resolveEntitlement: ctx.getEntitlement,
    }),
  ),
});
