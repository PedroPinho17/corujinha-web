/** Config estático do Better Auth — testável sem DataSource. */
export const authEmailPassword = {
  enabled: true,
  disableSignUp: true,
  minPasswordLength: 12,
} as const;

/** Secure cookies follow the site's own protocol, so they cannot be turned off by unrelated flags. */
export function authCookieSecure(isProd: boolean, siteUrl: string): boolean {
  return isProd && siteUrl.startsWith("https://");
}

/** WebAuthn RP ID must match the site's domain; passkeys fail on any other value. */
export function resolveWebAuthnRpId(explicit: string | undefined, siteUrl: string): string {
  const rpId = explicit?.trim();
  if (rpId) return rpId;
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return "localhost";
  }
}
