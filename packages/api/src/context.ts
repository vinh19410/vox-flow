import type { Session } from "@vox-flow/auth";
import type { Database } from "@vox-flow/db";

export type Context = {
  session: Session | null;
  db: Database;
  env?: {
    ADMIN_EMAILS?: string;
    [key: string]: unknown;
  };
};
