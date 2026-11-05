import type { Context as ApiContext } from "@vox-flow/api/context";
import type { Context as HonoContext } from "hono";

import { getDb } from "./services";
import { createAuth } from "./services";
import { ENV } from "./env.server";

export type CreateContextOptions = {
  context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions): Promise<ApiContext> {
  const db = await getDb();
  const session = await (
    await createAuth(db)
  ).api.getSession({
    headers: context.req.raw.headers,
  });
  const adminEmails =
    ENV && typeof ENV === "object" && "ADMIN_EMAILS" in ENV && typeof ENV.ADMIN_EMAILS === "string"
      ? ENV.ADMIN_EMAILS
      : "";
  return {
    db,
    session,
    env: {
      ...(typeof ENV === "object" && ENV !== null ? ENV : {}),
      ADMIN_EMAILS: adminEmails,
    } as ApiContext["env"],
  };
}

export type Context = ApiContext;
