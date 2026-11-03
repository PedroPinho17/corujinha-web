/** Config estático do Better Auth — testável sem DataSource. */
export const authEmailPassword = {
  enabled: true,
  disableSignUp: true,
  minPasswordLength: 12,
} as const;
