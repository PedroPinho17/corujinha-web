import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (this.transporter) return this.transporter;
    const host = process.env.SMTP_HOST;
    if (!host) return null;
    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth:
        process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });
    return this.transporter;
  }

  async send(opts: { to: string; subject: string; text: string; html?: string; replyTo?: string }) {
    const from = process.env.SMTP_FROM ?? "noreply@corujinha.local";
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.warn(`SMTP not configured — email logged only: ${opts.subject} → ${opts.to}`);
      this.logger.log(opts.text);
      return;
    }
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      replyTo: opts.replyTo,
    });
  }
}
