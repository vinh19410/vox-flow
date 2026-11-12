import {
  createAuth,
  MAX_USER_IMAGE_LENGTH,
  MAX_USER_NAME_LENGTH,
  type AuthConfig,
} from "@vox-flow/auth";
import * as authSchema from "@vox-flow/db/schema/auth";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDbContext } from "./db";

describe("Better Auth with Google provider (WI-07)", () => {
  let testCtx: TestDbContext;

  beforeAll(async () => {
    testCtx = await createTestDb();
  });

  afterAll(async () => {
    if (testCtx) {
      await testCtx.dispose();
    }
  });

  const authConfig = {
    BETTER_AUTH_SECRET: "test-better-auth-secret-min-32-chars-long!",
    BETTER_AUTH_URL: "http://localhost:3000",
    CORS_ORIGIN: "http://localhost:3001/", // Test trailing slash sanitization
    GOOGLE_CLIENT_ID: "test-google-client-id.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  } satisfies AuthConfig;

  it("configures socialProviders.google and sanitizes CORS_ORIGIN", async () => {
    const auth = createAuth(authConfig, testCtx.db);

    // Verify socialProviders.google is configured
    expect(auth.options.socialProviders?.google).toBeDefined();
    expect(auth.options.socialProviders?.google?.clientId).toBe(
      "test-google-client-id.apps.googleusercontent.com",
    );

    // Verify trustedOrigins stripped the trailing slash and contains only CORS_ORIGIN
    expect(auth.options.trustedOrigins).toEqual(["http://localhost:3001"]);
    // Verify signInSocial initiates OAuth URL redirect to accounts.google.com with correct redirect_uri
    const response = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: "http://localhost:3001/app/dashboard",
      },
    });

    expect(response).toBeDefined();
    expect(response.url).toMatch(/^https:\/\/accounts\.google\.com/);
    expect(response.url).toContain(
      "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fgoogle",
    );
  });

  it("enables email/password with auto sign-in and password length bounds", () => {
    const auth = createAuth(authConfig, testCtx.db);
    expect(auth.options.emailAndPassword).toMatchObject({
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    });
  });

  it("signs up and signs in with email/password, returning a session", async () => {
    const auth = createAuth(authConfig, testCtx.db);
    const signUp = await auth.api.signUpEmail({
      body: {
        email: "tester@example.com",
        password: "Password123!",
        name: "Tester",
      },
    });
    expect(signUp.user.email).toBe("tester@example.com");
    expect(signUp.token).toBeTruthy();

    const signIn = await auth.api.signInEmail({
      body: {
        email: "tester@example.com",
        password: "Password123!",
      },
    });
    expect(signIn.user.email).toBe("tester@example.com");
    expect(signIn.token).toBeTruthy();
  });

  it("sign-up accepts a Google avatar https URL via user.create.before", async () => {
    const auth = createAuth(authConfig, testCtx.db);
    const signUp = await auth.api.signUpEmail({
      body: {
        email: "google-avatar@example.com",
        password: "Password123!",
        name: "Google Avatar",
        image: "https://lh3.googleusercontent.com/a/ACg8ocK-example=s96-c",
      },
    });
    expect(signUp.user.image).toBe(
      "https://lh3.googleusercontent.com/a/ACg8ocK-example=s96-c",
    );
  });

  it("sign-up rejects a script-bearing SVG data URL with INVALID_IMAGE", async () => {
    const auth = createAuth(authConfig, testCtx.db);
    await expect(
      auth.api.signUpEmail({
        body: {
          email: "evil-svg@example.com",
          password: "Password123!",
          name: "Evil SVG",
          image:
            "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+",
        },
      }),
    ).rejects.toThrow("INVALID_IMAGE");
  });

  it("sign-up rejects an image exceeding MAX_USER_IMAGE_LENGTH", async () => {
    const auth = createAuth(authConfig, testCtx.db);
    await expect(
      auth.api.signUpEmail({
        body: {
          email: "huge-image@example.com",
          password: "Password123!",
          name: "Huge Image",
          image: `data:image/webp;base64,${"A".repeat(MAX_USER_IMAGE_LENGTH)}`,
        },
      }),
    ).rejects.toThrow("INVALID_IMAGE");
  });

  it("updateUser accepts /avatars/ static path and compressed data URL, rejects javascript: scheme", async () => {
    const auth = createAuth(authConfig, testCtx.db);
    const signUp = await auth.api.signUpEmail({
      body: {
        email: "update-image@example.com",
        password: "Password123!",
        name: "Update Image",
      },
    });
    expect(signUp.user.id).toBeTruthy();

    // Đăng nhập qua handler thật để nhận Set-Cookie đã ký, tái dùng cho updateUser
    const signInRes = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "update-image@example.com",
          password: "Password123!",
        }),
      }),
    );
    expect(signInRes.status).toBe(200);
    const setCookies = signInRes.headers.getSetCookie();
    const sessionSetCookie = setCookies.find((c) =>
      c.includes("session_token="),
    );
    expect(sessionSetCookie).toBeDefined();
    expect(sessionSetCookie).toMatch(/;\s*HttpOnly\b/i);
    expect(sessionSetCookie).toMatch(/;\s*Secure\b/i);
    expect(sessionSetCookie).toMatch(/;\s*SameSite=None\b/i);

    const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
    expect(cookieHeader).toContain("session_token=");
    const headers = new Headers({ cookie: cookieHeader });

    // Preset tĩnh /avatars/ được chấp nhận (updateUser trả {status:true},
    // kiểm chứng qua getSession)
    await auth.api.updateUser({
      body: { image: "/avatars/owl-scholar.svg" },
      headers,
    });
    const afterPreset = await auth.api.getSession({ headers });
    expect(afterPreset?.user.image).toBe("/avatars/owl-scholar.svg");

    // Data URL webp đã nén được chấp nhận
    const dataUrl =
      "data:image/webp;base64,UklGRhIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
    await auth.api.updateUser({ body: { image: dataUrl }, headers });
    const afterDataUrl = await auth.api.getSession({ headers });
    expect(afterDataUrl?.user.image).toBe(dataUrl);

    // Xóa avatar (null) được chấp nhận
    await auth.api.updateUser({ body: { image: null }, headers });
    const afterNull = await auth.api.getSession({ headers });
    expect(afterNull?.user.image).toBeNull();

    // javascript: bị từ chối, user giữ nguyên ảnh
    await expect(
      auth.api.updateUser({
        body: { image: "javascript:alert(1)" },
        headers,
      }),
    ).rejects.toThrow("INVALID_IMAGE");
    const afterReject = await auth.api.getSession({ headers });
    expect(afterReject?.user.image).toBeNull();
  });

  it("rejects sign-in with a wrong password with INVALID_EMAIL_OR_PASSWORD", async () => {
    const auth = createAuth(authConfig, testCtx.db);
    await auth.api.signUpEmail({
      body: {
        email: "wrong-pass@example.com",
        password: "Password123!",
        name: "Wrong Pass",
      },
    });

    const err = await auth.api
      .signInEmail({
        body: {
          email: "wrong-pass@example.com",
          password: "NotThePassword1!",
        },
      })
      .then(
        () => null,
        (e: unknown) => e,
      );

    expect(err).toMatchObject({
      statusCode: 401,
      body: { code: "INVALID_EMAIL_OR_PASSWORD" },
    });
  });

  it("rejects sign-in with a non-existent email with INVALID_EMAIL_OR_PASSWORD", async () => {
    const auth = createAuth(authConfig, testCtx.db);

    const err = await auth.api
      .signInEmail({
        body: {
          email: "nonexistent@example.com",
          password: "Password123!",
        },
      })
      .then(
        () => null,
        (e: unknown) => e,
      );

    expect(err).toMatchObject({
      statusCode: 401,
      body: { code: "INVALID_EMAIL_OR_PASSWORD" },
    });
  });

  it("validates display name length (1..50 trimmed) on signUpEmail and updateUser", async () => {
    const auth = createAuth(authConfig, testCtx.db);

    const whitespaceSignUpErr = await auth.api
      .signUpEmail({
        body: {
          email: "whitespace-name@example.com",
          password: "Password123!",
          name: "   ",
        },
      })
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(whitespaceSignUpErr).toMatchObject({
      statusCode: 400,
      body: { code: "INVALID_NAME", message: "INVALID_NAME" },
    });

    const longSignUpErr = await auth.api
      .signUpEmail({
        body: {
          email: "long-name@example.com",
          password: "Password123!",
          name: "N".repeat(MAX_USER_NAME_LENGTH + 1),
        },
      })
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(longSignUpErr).toMatchObject({
      statusCode: 400,
      body: { code: "INVALID_NAME", message: "INVALID_NAME" },
    });

    const exact50SignUp = "N".repeat(MAX_USER_NAME_LENGTH);
    const signUp = await auth.api.signUpEmail({
      body: {
        email: "valid-name@example.com",
        password: "Password123!",
        name: `  ${exact50SignUp}  `,
      },
    });
    expect(signUp.user.name).toBe(exact50SignUp);

    const signInRes = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "valid-name@example.com",
          password: "Password123!",
        }),
      }),
    );
    expect(signInRes.status).toBe(200);
    const cookieHeader = signInRes.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");
    const headers = new Headers({ cookie: cookieHeader });

    const whitespaceUpdateErr = await auth.api
      .updateUser({ body: { name: "   " }, headers })
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(whitespaceUpdateErr).toMatchObject({
      statusCode: 400,
      body: { code: "INVALID_NAME", message: "INVALID_NAME" },
    });

    const longUpdateErr = await auth.api
      .updateUser({
        body: { name: "M".repeat(MAX_USER_NAME_LENGTH + 1) },
        headers,
      })
      .then(
        () => null,
        (e: unknown) => e,
      );
    expect(longUpdateErr).toMatchObject({
      statusCode: 400,
      body: { code: "INVALID_NAME", message: "INVALID_NAME" },
    });

    const unchangedSession = await auth.api.getSession({ headers });
    expect(unchangedSession?.user.name).toBe(exact50SignUp);

    const exact50Update = "M".repeat(MAX_USER_NAME_LENGTH);
    await auth.api.updateUser({
      body: { name: `  ${exact50Update}  ` },
      headers,
    });
    const updatedSession = await auth.api.getSession({ headers });
    expect(updatedSession?.user.name).toBe(exact50Update);
  });

  it("enforces in-memory rate limit per cf-connecting-ip when enableRateLimit is true", async () => {
    const defaultAuth = createAuth(authConfig, testCtx.db);
    expect(defaultAuth.options.rateLimit?.enabled).toBe(false);

    const rateLimitedAuth = createAuth(authConfig, testCtx.db, {
      enableRateLimit: true,
    });
    expect(rateLimitedAuth.options.rateLimit?.enabled).toBe(true);
    expect(rateLimitedAuth.options.advanced?.ipAddress?.ipAddressHeaders).toEqual(
      ["cf-connecting-ip"],
    );

    const postSignIn = (ip: string) =>
      rateLimitedAuth.handler(
        new Request("http://localhost:3000/api/auth/sign-in/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "cf-connecting-ip": ip,
          },
          body: JSON.stringify({
            email: "ratelimit-target@example.com",
            password: "Password123!",
          }),
        }),
      );

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await postSignIn("203.0.113.10");
      expect(res.status).toBe(401);
    }

    const fourthSameIp = await postSignIn("203.0.113.10");
    expect(fourthSameIp.status).toBe(429);

    const otherIp = await postSignIn("203.0.113.11");
    expect(otherIp.status).toBe(401);
  });

  it("rejects a password sign-up whose email already belongs to a Google account", async () => {
    await testCtx.db.insert(authSchema.user).values({
      id: "google-user-1",
      name: "Google User",
      email: "google-user@example.com",
      emailVerified: true,
    });
    await testCtx.db.insert(authSchema.account).values({
      id: "google-account-1",
      accountId: "google-sub-1",
      providerId: "google",
      userId: "google-user-1",
    });

    const auth = createAuth(authConfig, testCtx.db);
    const err = await auth.api
      .signUpEmail({
        body: {
          email: "google-user@example.com",
          password: "Password123!",
          name: "Impostor",
        },
      })
      .then(
        () => null,
        (e: unknown) => e,
      );

    expect(err).toMatchObject({
      statusCode: 422,
      body: { code: expect.stringMatching(/^USER_ALREADY_EXISTS/) },
    });
  });

  it("rejects a second sign-up with the same email", async () => {
    const auth = createAuth(authConfig, testCtx.db);
    await auth.api.signUpEmail({
      body: {
        email: "duplicate@example.com",
        password: "Password123!",
        name: "First",
      },
    });

    const err = await auth.api
      .signUpEmail({
        body: {
          email: "duplicate@example.com",
          password: "Password456!",
          name: "Second",
        },
      })
      .then(
        () => null,
        (e: unknown) => e,
      );

    expect(err).toMatchObject({
      statusCode: 422,
      body: { code: expect.stringMatching(/^USER_ALREADY_EXISTS/) },
    });
  });
});
