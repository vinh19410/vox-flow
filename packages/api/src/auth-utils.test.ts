import { describe, expect, it } from "vitest";
import { canAccessAudio, isUserAdmin } from "./auth-utils";

describe("isUserAdmin", () => {
  it("returns true for matching email regardless of case or whitespace", () => {
    expect(isUserAdmin("Admin@Example.com", " admin@example.com , other@test.com ")).toBe(true);
    expect(isUserAdmin("OTHER@TEST.COM", "admin@example.com,other@test.com")).toBe(true);
  });

  it("returns false for non-matching email", () => {
    expect(isUserAdmin("user@example.com", "admin@example.com,other@test.com")).toBe(false);
  });

  it("returns false when adminEmailsRaw is empty or undefined", () => {
    expect(isUserAdmin("admin@example.com", "")).toBe(false);
    expect(isUserAdmin("admin@example.com", undefined)).toBe(false);
    expect(isUserAdmin("admin@example.com", null)).toBe(false);
  });

  it("returns false when userEmail is empty or undefined", () => {
    expect(isUserAdmin("", "admin@example.com")).toBe(false);
    expect(isUserAdmin(undefined, "admin@example.com")).toBe(false);
    expect(isUserAdmin(null, "admin@example.com")).toBe(false);
  });
});

describe("canAccessAudio", () => {
  const ownerId = "student_user_1";
  const studentEmail = "student@example.com";
  const adminEmail = "admin@example.com";
  const strangerId = "stranger_user_2";
  const strangerEmail = "stranger@example.com";
  const adminList = "admin@example.com,lead@example.com";

  it("grants access to attempt owner unconditionally (even without dispute consent)", () => {
    expect(
      canAccessAudio({
        userId: ownerId,
        userEmail: studentEmail,
        attemptOwnerId: ownerId,
        adminEmails: adminList,
        disputeShareConsent: false,
      }),
    ).toBe(true);

    expect(
      canAccessAudio({
        userId: ownerId,
        userEmail: studentEmail,
        attemptOwnerId: ownerId,
        adminEmails: adminList,
        disputeShareConsent: null,
      }),
    ).toBe(true);
  });

  it("grants access to admin ONLY when dispute shareConsent is true", () => {
    expect(
      canAccessAudio({
        userId: "admin_user_id",
        userEmail: adminEmail,
        attemptOwnerId: ownerId,
        adminEmails: adminList,
        disputeShareConsent: true,
      }),
    ).toBe(true);
  });

  it("denies access to admin when dispute shareConsent is false or absent", () => {
    expect(
      canAccessAudio({
        userId: "admin_user_id",
        userEmail: adminEmail,
        attemptOwnerId: ownerId,
        adminEmails: adminList,
        disputeShareConsent: false,
      }),
    ).toBe(false);

    expect(
      canAccessAudio({
        userId: "admin_user_id",
        userEmail: adminEmail,
        attemptOwnerId: ownerId,
        adminEmails: adminList,
        disputeShareConsent: null,
      }),
    ).toBe(false);
  });

  it("denies access to stranger even if dispute shareConsent is true", () => {
    expect(
      canAccessAudio({
        userId: strangerId,
        userEmail: strangerEmail,
        attemptOwnerId: ownerId,
        adminEmails: adminList,
        disputeShareConsent: true,
      }),
    ).toBe(false);
  });

  it("denies access when ADMIN_EMAILS list is empty or undefined", () => {
    expect(
      canAccessAudio({
        userId: "admin_user_id",
        userEmail: adminEmail,
        attemptOwnerId: ownerId,
        adminEmails: "",
        disputeShareConsent: true,
      }),
    ).toBe(false);
  });
});
