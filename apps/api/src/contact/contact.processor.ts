import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";

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
    if (!contact) return;

    const to = process.env.CONTACT_NOTIFY_TO ?? "pedro0409romariz@gmail.com";
    const isEnrollment = contact.kind === "ENROLLMENT";
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
          "",
          contact.message,
        ]
          .filter(Boolean)
          .join("\n"),
        html: `<p><strong>Tipo:</strong> ${isEnrollment ? "Inscrição" : "Mensagem"}</p>
          <p><strong>Nome:</strong> ${contact.name}</p>
          <p><strong>Email:</strong> ${contact.email}</p>
          <p><strong>Telefone:</strong> ${contact.phone ?? "-"}</p>
          ${contact.subject ? `<p><strong>Disciplina:</strong> ${contact.subject}</p>` : ""}
          ${contact.schoolYear ? `<p><strong>Ano:</strong> ${contact.schoolYear}</p>` : ""}
          ${contact.location ? `<p><strong>Polo:</strong> ${contact.location}</p>` : ""}
          <p>${contact.message.replace(/\n/g, "<br/>")}</p>`,
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
