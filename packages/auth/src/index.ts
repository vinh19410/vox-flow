import { APIError } from "@better-auth/core/error";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@vox-flow/db";
import * as schema from "@vox-flow/db/schema/auth";
import { betterAuth } from "better-auth";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
};

/** Giới hạn dung lượng ảnh đại diện lưu trữ (base64 data URL hoặc URL ngoài). */
export const MAX_USER_IMAGE_LENGTH = 200_000;

const DATA_IMAGE_ALLOWED = /^data:image\/(webp|jpeg|png);base64,/;

/**
 * Kiểm tra trường `image` do client gửi lên qua /update-user.
 * Chỉ chấp nhận: URL https, data URL ảnh (webp/jpeg/png) đã nén, hoặc đường
 * dẫn avatar nội bộ `/avatars/...`. Trả về `false` để từ chối cập nhật.
 */
export function validateUserImage(
  image: unknown,
): { data: { image: string | null } } | false | undefined {
  if (image === undefined) return undefined;
  if (image === null) return { data: { image: null } };

  if (typeof image !== "string" || image.length === 0) return false;
  if (image.length > MAX_USER_IMAGE_LENGTH) return false;

  if (image.startsWith("https://")) return undefined;
  if (DATA_IMAGE_ALLOWED.test(image)) return undefined;
  if (image.startsWith("/avatars/")) return undefined;

  return false;
}

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
