import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";
import { RedisRateLimiter } from "../common/rate-limit";
import { CONTACT_QUEUE } from "./contact.processor";
import type { ContactDto } from "./contact.dto";

@Injectable()
export class ContactService {
  private readonly limiter: RedisRateLimiter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue(CONTACT_QUEUE) private readonly queue: Queue,
  ) {
    this.limiter = new RedisRateLimiter(this.redis.client, 5, 15 * 60 * 1000, "rl:contact");
  }

  async submit(dto: ContactDto, ip: string) {
    if (dto.website?.trim()) {
      return {
        success: true,
        message: "Mensagem enviada com sucesso!",
      };
    }

    if (!(await this.limiter.allow(ip))) {
      throw new HttpException(
        "Demasiados pedidos. Tenta mais tarde.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!dto.privacyConsent) {
      throw new BadRequestException("É necessário aceitar a política de privacidade.");
    }

    const kind = dto.kind === "ENROLLMENT" ? "ENROLLMENT" : "GENERAL";
    const row = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
        kind,
        subject: dto.subject,
        schoolYear: dto.schoolYear,
        location: dto.location,
        privacyConsent: true,
        consentAt: new Date(),
      },
    });
    await this.queue.add("send", { contactId: row.id });
    return {
      success: true,
      message:
        kind === "ENROLLMENT"
          ? "Pedido de inscrição enviado! Entraremos em contacto em breve."
          : "Mensagem enviada com sucesso!",
    };
  }

  list() {
    return this.prisma.contactMessage.findMany({
      where: { erasedAt: null },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async update(
    id: string,
    dto: { read?: boolean; adminNotes?: string },
  ) {
    await this.requireActive(id);
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        ...(dto.read === true ? { readAt: new Date() } : {}),
        ...(dto.read === false ? { readAt: null } : {}),
        ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes } : {}),
      },
    });
  }

  async exportGdpr(id: string) {
    const contact = await this.requireActive(id);
    return {
      format: "corujinha-contact-gdpr-v1",
      exportedAt: new Date().toISOString(),
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        message: contact.message,
        kind: contact.kind,
        subject: contact.subject,
        schoolYear: contact.schoolYear,
        location: contact.location,
        status: contact.status,
        privacyConsent: contact.privacyConsent,
        consentAt: contact.consentAt,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      },
    };
  }

  async eraseGdpr(id: string) {
    const existing = await this.requireActive(id);
    await this.prisma.contactMessage.update({
      where: { id: existing.id },
      data: {
        name: "Apagado (RGPD)",
        email: `erased-${existing.id}@anon.corujinha.local`,
        phone: null,
        message: "[apagado]",
        subject: null,
        schoolYear: null,
        location: null,
        privacyConsent: false,
        consentAt: null,
        erasedAt: new Date(),
      },
    });
    return { ok: true };
  }

  private async requireActive(id: string) {
    const existing = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!existing || existing.erasedAt) {
      throw new NotFoundException("Contacto não encontrado");
    }
    return existing;
  }
}
