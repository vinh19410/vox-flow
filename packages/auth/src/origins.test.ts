import type { Database } from "@vox-flow/db";
import { describe, expect, it } from "vitest";

import {
  createAuth,
  isOriginAllowed,
  parseAllowedOrigins,
  resolveCorsOriginHeader,
} from "./index";

describe("parseAllowedOrigins", () => {
  it("returns empty array for undefined, null, empty, or whitespace-only input", () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
    expect(parseAllowedOrigins(null)).toEqual([]);
    expect(parseAllowedOrigins("")).toEqual([]);
    expect(parseAllowedOrigins("   ,  , \t ")).toEqual([]);
  });

  it("trims whitespace, strips trailing slashes, and omits empty entries", () => {
    expect(
      parseAllowedOrigins(
        "  http://localhost:3001/ , , https://vox.vinhtran.io.vn/// , / , http://localhost:3002 ",
      ),
    ).toEqual([
      "http://localhost:3001",
      "https://vox.vinhtran.io.vn",
      "http://localhost:3002",
    ]);
  });

  it("deduplicates repeated entries including trailing-slash variants", () => {
    expect(
      parseAllowedOrigins(
        "http://localhost:3001, http://localhost:3001/, http://localhost:3002, http://localhost:3001",
      ),
    ).toEqual(["http://localhost:3001", "http://localhost:3002"]);
  });

  it("keeps wildcard '*' entry when present", () => {
    expect(parseAllowedOrigins("*")).toEqual(["*"]);
    expect(parseAllowedOrigins("*, http://localhost:3001")).toEqual([
      "*",
      "http://localhost:3001",
    ]);
  });
});

describe("isOriginAllowed", () => {
  it("matches allowed origins ignoring trailing slash and whitespace", () => {
    const allowed = ["http://localhost:3001", "https://admin.vox.vinhtran.io.vn"];
    expect(isOriginAllowed("http://localhost:3001", allowed)).toBe(true);
    expect(isOriginAllowed("http://localhost:3001/", allowed)).toBe(true);
    expect(isOriginAllowed("https://admin.vox.vinhtran.io.vn", allowed)).toBe(
      true,
    );
  });

  it("rejects unknown or empty origins", () => {
    const allowed = ["http://localhost:3001", "http://localhost:3002"];
    expect(isOriginAllowed("https://evil.example.com", allowed)).toBe(false);
    expect(isOriginAllowed("", allowed)).toBe(false);
    expect(isOriginAllowed("   ", allowed)).toBe(false);
    expect(isOriginAllowed("http://localhost:3001", [])).toBe(false);
  });

  it("allows any non-empty origin when wildcard '*' is included", () => {
    expect(isOriginAllowed("https://anything.example.com", ["*"])).toBe(true);
    expect(isOriginAllowed("", ["*"])).toBe(false);
  });
});

describe("resolveCorsOriginHeader", () => {
  it("reflects non-empty requestOrigin or returns '*' when allowed includes '*'", () => {
    expect(resolveCorsOriginHeader("http://localhost:3001", ["*"])).toBe(
      "http://localhost:3001",
    );
    expect(resolveCorsOriginHeader(undefined, ["*"])).toBe("*");
    expect(resolveCorsOriginHeader("", ["*"])).toBe("*");
    expect(resolveCorsOriginHeader("   ", ["*"])).toBe("*");
  });

  it("returns matching requestOrigin and null for unknown or missing origin", () => {
    const allowed = ["http://localhost:3001", "http://localhost:3002"];
    expect(resolveCorsOriginHeader("http://localhost:3001", allowed)).toBe(
      "http://localhost:3001",
    );
    expect(resolveCorsOriginHeader("http://localhost:3002/", allowed)).toBe(
      "http://localhost:3002/",
    );
    expect(resolveCorsOriginHeader("https://evil.example.com", allowed)).toBeNull();
    expect(resolveCorsOriginHeader(undefined, allowed)).toBeNull();
    expect(resolveCorsOriginHeader("", allowed)).toBeNull();
  });
});

describe("createAuth trustedOrigins", () => {
  const baseEnv = {
    BETTER_AUTH_URL: "https://api.vox.vinhtran.io.vn",
    BETTER_AUTH_SECRET: "0123456789abcdef0123456789abcdef",
    GOOGLE_CLIENT_ID: "google-client-id",
    GOOGLE_CLIENT_SECRET: "google-client-secret",
  };

  it("populates trustedOrigins from multi-origin CORS_ORIGIN and excludes '*'", () => {
    const fakeDb = {} as Database;
    const multiAuth = createAuth(
      {
        ...baseEnv,
        CORS_ORIGIN:
          "http://localhost:3001/, https://admin.vox.vinhtran.io.vn , *",
      },
      fakeDb,
    );
    expect(multiAuth.options.trustedOrigins).toEqual([
      "http://localhost:3001",
      "https://admin.vox.vinhtran.io.vn",
    ]);

    const wildcardOnlyAuth = createAuth(
      { ...baseEnv, CORS_ORIGIN: "*" },
      fakeDb,
    );
    expect(wildcardOnlyAuth.options.trustedOrigins).toEqual([]);
  });
});
