import { initTRPC, TRPCError } from "@trpc/server";

import { isUserAdmin, canAccessAudio } from "./auth-utils";
import type { Context } from "./context";

export { isUserAdmin, canAccessAudio };
export * from "./audio";
export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const adminEmailsRaw = ctx.env?.ADMIN_EMAILS ?? "";
  if (!isUserAdmin(ctx.session.user.email, adminEmailsRaw)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});
