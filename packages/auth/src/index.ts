import { APIError } from "@better-auth/core/error";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@vox-flow/db";
import * as schema from "@vox-flow/db/schema/auth";
import { betterAuth } from "better-auth";

import { validateUserImage } from "./image-validation";
import { validateUserName } from "./name-validation";

export {
  MAX_USER_IMAGE_LENGTH,
  validateUserImage,
} from "./image-validation";
export {
  MAX_USER_NAME_LENGTH,
  validateUserName,
} from "./name-validation";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

export type CreateAuthOptions = {
  enableRateLimit?: boolean;
};

function validateUserHookData(data: { name?: unknown; image?: unknown }) {
  const overrides: { name?: string; image?: string | null } = {};

  if ("name" in data) {
    const result = validateUserName(data.name);
    if (result === false) {
      throw new APIError("BAD_REQUEST", {
        message: "INVALID_NAME",
        code: "INVALID_NAME",
      });
    }
    if (result?.data) {
      overrides.name = result.data.name;
    }
  }

  if ("image" in data) {
    const result = validateUserImage(data.image);
    if (result === false) {
      throw new APIError("BAD_REQUEST", {
        message: "INVALID_IMAGE",
        code: "INVALID_IMAGE",
      });
    }
    if (result?.data) {
      overrides.image = result.data.image;
    }
  }

  return Object.keys(overrides).length > 0 ? { data: overrides } : undefined;
}

export function createAuth(
  env: AuthConfig,
  database: Database,
  options: CreateAuthOptions = {},
) {
  const cleanCorsOrigin = env.CORS_ORIGIN.replace(/\/+$/, "");
  const runtimeGlobal: {
    readonly Object: unknown;
    readonly process?:
      | { readonly env?: { readonly NODE_ENV?: string | undefined } }
      | undefined;
  } = globalThis;
  const nodeEnv = runtimeGlobal.process?.env?.NODE_ENV;

  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "sqlite",
      schema,
    }),
    trustedOrigins: [cleanCorsOrigin],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    rateLimit: {
      enabled: options.enableRateLimit ?? nodeEnv !== "test",
      window: 10,
      max: 100,
      storage: "memory",
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
          before: async (data) => validateUserHookData(data),
        },
        update: {
          before: async (data) => validateUserHookData(data),
        },
      },
    },
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
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
