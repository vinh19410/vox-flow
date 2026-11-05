export function isUserAdmin(
  userEmail: string | undefined | null,
  adminEmailsRaw: string | undefined | null,
): boolean {
  if (!userEmail || !adminEmailsRaw) return false;
  const adminEmails = new Set(
    adminEmailsRaw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
  return adminEmails.has(userEmail.trim().toLowerCase());
}

export interface CanAccessAudioParams {
  userId: string;
  userEmail?: string | null;
  attemptOwnerId: string;
  adminEmails?: string | null;
  disputeShareConsent?: boolean | null;
}

export function canAccessAudio(params: CanAccessAudioParams): boolean {
  // 1. Attempt owner always has access to their own audio
  if (params.userId === params.attemptOwnerId) {
    return true;
  }

  // 2. Admin access ONLY when explicit student share consent is granted
  const isAdmin = isUserAdmin(params.userEmail, params.adminEmails);
  if (isAdmin && params.disputeShareConsent === true) {
    return true;
  }

  // 3. All other callers (non-admin, or admin without student consent) denied
  return false;
}
