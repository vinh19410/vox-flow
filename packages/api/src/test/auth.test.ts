import { createAuth, type AuthConfig } from "@vox-flow/auth";
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

  it("enables email/password with auto sign-in", () => {
    const auth = createAuth(authConfig, testCtx.db);
    expect(auth.options.emailAndPassword).toMatchObject({
      enabled: true,
      autoSignIn: true,
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
