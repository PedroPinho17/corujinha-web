/** Interpret SMTP_SECURE; default secure only on port 465. */
export function smtpSecure(port: number): boolean {
  const raw = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return port === 465;
}
