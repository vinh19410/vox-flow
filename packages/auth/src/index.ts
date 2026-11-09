import { APIError } from "@better-auth/core/error";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@vox-flow/db";
import * as schema from "@vox-flow/db/schema/auth";
import { betterAuth } from "better-auth";

import { validateUserImage } from "./image-validation";

export {
  MAX_USER_IMAGE_LENGTH,
  validateUserImage,
} from "./image-validation";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

export function createAuth(
  env: AuthConfig,
  database: Database,
  desktopOrigins: readonly string[] = [],
) {
  const cleanCorsOrigin = env.CORS_ORIGIN.replace(/\/+$/, "");
  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "sqlite",
      schema,
    }),
    trustedOrigins: [cleanCorsOrigin, ...desktopOrigins],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    databaseHooks: {
      user: {
        create: {
          before: async (data) => {
            if (!("image" in data)) return;
            const result = validateUserImage(data.image);
            if (result === false) {
              throw new APIError("BAD_REQUEST", {
                message: "INVALID_IMAGE",
              });
            }
            return result;
          },
        },
        update: {
          before: async (data) => {
            if (!("image" in data)) return;
            const result = validateUserImage(data.image);
            if (result === false) {
              throw new APIError("BAD_REQUEST", {
                message: "INVALID_IMAGE",
              });
            }
            return result;
          },
        },
      },
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [],
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
