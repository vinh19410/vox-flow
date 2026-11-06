import { createAuth, type AuthConfig } from "@vox-flow/auth";
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

    // Verify trustedOrigins stripped the trailing slash
    expect(auth.options.trustedOrigins).toContain("http://localhost:3001");
    expect(auth.options.trustedOrigins).not.toContain("http://localhost:3001/");

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

  it("rejects email/password sign-up at runtime with EMAIL_PASSWORD_SIGN_UP_DISABLED", async () => {
    const auth = createAuth(authConfig, testCtx.db);
    const err = await auth.api
      .signUpEmail({
        body: {
          email: "tester@example.com",
          password: "Password123!",
          name: "Tester",
        },
      })
      .then(
        () => null,
        (e: unknown) => e,
      );

    expect(err).toMatchObject({
      statusCode: 400,
      body: { code: "EMAIL_PASSWORD_SIGN_UP_DISABLED" },
    });
  });

  it("rejects email/password sign-in at runtime with EMAIL_PASSWORD_DISABLED", async () => {
    const auth = createAuth(authConfig, testCtx.db);
    const err = await auth.api
      .signInEmail({
        body: {
          email: "tester@example.com",
          password: "Password123!",
        },
      })
      .then(
        () => null,
        (e: unknown) => e,
      );

    expect(err).toMatchObject({
      statusCode: 400,
      body: { code: "EMAIL_PASSWORD_DISABLED" },
    });
  });
});
