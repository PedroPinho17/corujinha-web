import { createTransport, type Transporter } from "nodemailer";
import { smtpSecure } from "./smtp-secure";

export type SendMailOpts = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

let sharedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (sharedTransporter) return sharedTransporter;
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  sharedTransporter = createTransport({
    host,
    port,
    secure: smtpSecure(port),
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
  return sharedTransporter;
}

/** Standalone mail sender (usable outside Nest DI, e.g. Better Auth hooks). */
export async function sendMail(opts: SendMailOpts): Promise<"sent" | "logged"> {
  const from = process.env.SMTP_FROM ?? "noreply@corujinha.local";
  const transporter = getTransporter();
  if (!transporter) {
    // eslint-disable-next-line no-console
    console.warn(`[mail] SMTP not configured — logged only: ${opts.subject} → ${opts.to}`);
    // eslint-disable-next-line no-console
    console.log(opts.text);
    return "logged";
  }
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    replyTo: opts.replyTo,
  });
  return "sent";
}

/** Test helper — clears cached transporter between specs. */
export function resetMailTransporterForTests() {
  sharedTransporter = null;
}
