import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { renderEmailHtml } from "../mail/email-layout";
import { escapeHtml } from "../common/escape-html";

export const CONTACT_QUEUE = "contact-email";

@Processor(CONTACT_QUEUE)
export class ContactProcessor extends WorkerHost {
  private readonly logger = new Logger(ContactProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    super();
  }

  async process(job: Job<{ contactId: string }>) {
    const contact = await this.prisma.contactMessage.findUnique({
      where: { id: job.data.contactId },
    });
    if (!contact || contact.erasedAt) return;

    const to = process.env.CONTACT_NOTIFY_TO?.trim();
    if (!to) {
      throw new Error("CONTACT_NOTIFY_TO não está definido — aviso de contacto não enviado.");
    }

    const isEnrollment = contact.kind === "ENROLLMENT";
    const name = escapeHtml(contact.name);
    const email = escapeHtml(contact.email);
    const phone = escapeHtml(contact.phone ?? "-");
    const subject = contact.subject ? escapeHtml(contact.subject) : null;
    const schoolYear = contact.schoolYear ? escapeHtml(contact.schoolYear) : null;
    const location = contact.location ? escapeHtml(contact.location) : null;
    const messageHtml = escapeHtml(contact.message).replace(/\n/g, "<br/>");
    const site =
      (process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(
        /\/$/,
        "",
      );

    try {
      await this.mail.send({
        to,
        subject: isEnrollment
          ? `Pedido de inscrição - Corujinha (${contact.name})`
          : `Nova Mensagem de Contacto - Corujinha`,
        replyTo: contact.email,
        text: [
          `Tipo: ${isEnrollment ? "Inscrição" : "Mensagem"}`,
          `Nome: ${contact.name}`,
          `Email: ${contact.email}`,
          `Telefone: ${contact.phone ?? "-"}`,
          contact.subject ? `Disciplina: ${contact.subject}` : null,
          contact.schoolYear ? `Ano: ${contact.schoolYear}` : null,
          contact.location ? `Polo: ${contact.location}` : null,
          `Consentimento privacidade: ${contact.privacyConsent ? "sim" : "não"}`,
          "",
          contact.message,
        ]
          .filter(Boolean)
          .join("\n"),
        html: renderEmailHtml({
          title: isEnrollment ? "Pedido de inscrição" : "Nova mensagem de contacto",
          preheader: `${contact.name} — ${contact.email}`,
          bodyHtml: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.6;color:#374151;">
            <tr><td style="padding:4px 0;"><strong>Tipo:</strong> ${isEnrollment ? "Inscrição" : "Mensagem"}</td></tr>
            <tr><td style="padding:4px 0;"><strong>Nome:</strong> ${name}</td></tr>
            <tr><td style="padding:4px 0;"><strong>Email:</strong> ${email}</td></tr>
            <tr><td style="padding:4px 0;"><strong>Telefone:</strong> ${phone}</td></tr>
            ${subject ? `<tr><td style="padding:4px 0;"><strong>Disciplina:</strong> ${subject}</td></tr>` : ""}
            ${schoolYear ? `<tr><td style="padding:4px 0;"><strong>Ano:</strong> ${schoolYear}</td></tr>` : ""}
            ${location ? `<tr><td style="padding:4px 0;"><strong>Polo:</strong> ${location}</td></tr>` : ""}
            <tr><td style="padding:4px 0;"><strong>Consentimento:</strong> ${contact.privacyConsent ? "sim" : "não"}</td></tr>
          </table>
          <p style="margin:20px 0 0;padding:16px;background:#fdf2f8;border-radius:12px;">${messageHtml}</p>`,
        }),
      });

      // Confirmação para a família (não bloqueia o aviso à equipa se falhar)
      try {
        await this.mail.send({
          to: contact.email,
          subject: isEnrollment
            ? "Recebemos o seu pedido de inscrição — Corujinha"
            : "Recebemos a sua mensagem — Corujinha",
          text: [
            `Olá ${contact.name},`,
            "",
            isEnrollment
              ? "Obrigado pelo pedido de inscrição na Corujinha. A nossa equipa vai analisar a disponibilidade e entrar em contacto consigo em breve."
              : "Obrigado pela sua mensagem. A nossa equipa vai responder o mais depressa possível.",
            "",
            "Com carinho,",
            "Centro de Apoio Escolar Corujinha",
            site,
          ].join("\n"),
          html: renderEmailHtml({
            title: isEnrollment ? "Pedido recebido" : "Mensagem recebida",
            preheader: "A Corujinha já recebeu o seu contacto",
            bodyHtml: `<p>Olá <strong>${name}</strong>,</p>
<p>${
              isEnrollment
                ? "Obrigado pelo pedido de inscrição na Corujinha. A nossa equipa vai analisar a disponibilidade e entrar em contacto consigo em breve."
                : "Obrigado pela sua mensagem. A nossa equipa vai responder o mais depressa possível."
            }</p>
<p style="margin:20px 0 0;color:#6b7280;font-size:14px;">Se não enviou este pedido, pode ignorar este email.</p>`,
            cta: { label: "Visitar o site", href: site },
          }),
        });
      } catch (confirmErr) {
        this.logger.warn(`Confirmação à família falhou (${contact.email}): ${String(confirmErr)}`);
      }

      await this.prisma.contactMessage.update({
        where: { id: contact.id },
        data: { status: "SENT" },
      });
    } catch (err) {
      this.logger.error(err);
      await this.prisma.contactMessage.update({
        where: { id: contact.id },
        data: { status: "FAILED" },
      });
      throw err;
    }
  }
}
