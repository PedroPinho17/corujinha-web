import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

export const CONTACT_QUEUE = "contact-email";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
        html: `<p><strong>Tipo:</strong> ${isEnrollment ? "Inscrição" : "Mensagem"}</p>
          <p><strong>Nome:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${phone}</p>
          ${subject ? `<p><strong>Disciplina:</strong> ${subject}</p>` : ""}
          ${schoolYear ? `<p><strong>Ano:</strong> ${schoolYear}</p>` : ""}
          ${location ? `<p><strong>Polo:</strong> ${location}</p>` : ""}
          <p><strong>Consentimento:</strong> ${contact.privacyConsent ? "sim" : "não"}</p>
          <p>${messageHtml}</p>`,
      });
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
