function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

/**
 * Parse a comma-separated `CORS_ORIGIN` config value into unique, normalized origins
 * (whitespace trimmed, trailing slashes stripped, empty entries omitted).
 */
export function parseAllowedOrigins(raw: string | undefined | null): string[] {
  if (!raw) {
    return [];
  }

  const seen = new Set<string>();
  const origins: string[] = [];

  for (const part of raw.split(",")) {
    const normalized = normalizeOrigin(part);
    if (normalized.length > 0 && !seen.has(normalized)) {
      seen.add(normalized);
      origins.push(normalized);
    }
  }

  return origins;
}

/**
 * Check whether an origin is permitted by an allowlist produced by `parseAllowedOrigins`.
 */
export function isOriginAllowed(
  origin: string,
  allowed: readonly string[],
): boolean {
  const normalized = normalizeOrigin(origin);
  if (normalized.length === 0) {
    return false;
  }

  return allowed.some(
    (entry) => entry === "*" || normalizeOrigin(entry) === normalized,
  );
}

/**
 * Resolve the `Access-Control-Allow-Origin` header value for a request origin.
 * Returns `null` when the origin is not permitted so unknown origins are never reflected.
 */
export function resolveCorsOriginHeader(
  requestOrigin: string | undefined,
  allowed: readonly string[],
): string | null {
  if (allowed.includes("*")) {
    return requestOrigin && requestOrigin.trim().length > 0
      ? requestOrigin
      : "*";
  }

  if (!requestOrigin) {
    return null;
  }

  return isOriginAllowed(requestOrigin, allowed) ? requestOrigin : null;
}
