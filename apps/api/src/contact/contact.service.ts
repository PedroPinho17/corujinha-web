import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { ContactKind, ContactMessage } from "@corujinha/database";
import { CONTACT_QUEUE } from "@corujinha/shared";
import { Queue } from "bullmq";
import { IsNull, LessThan, Repository } from "typeorm";
import { RedisService } from "../redis/redis.service";
import { RedisRateLimiter } from "../common/rate-limit";
import type { ContactDto } from "./contact.dto";

/** Default RGPD retention for contact messages (months). Override with CONTACT_RETENTION_MONTHS. */
export const CONTACT_RETENTION_MONTHS_DEFAULT = 24;

@Injectable()
export class ContactService {
  private readonly limiter: RedisRateLimiter;
  /** Caps confirmation emails to arbitrary destinations (B4). */
  private readonly emailLimiter: RedisRateLimiter;

  constructor(
    @InjectRepository(ContactMessage) private readonly contacts: Repository<ContactMessage>,
    private readonly redis: RedisService,
    @InjectQueue(CONTACT_QUEUE) private readonly queue: Queue,
  ) {
    this.limiter = new RedisRateLimiter(this.redis.client, 5, 15 * 60 * 1000, "rl:contact");
    this.emailLimiter = new RedisRateLimiter(
      this.redis.client,
      3,
      60 * 60 * 1000,
      "rl:contact-email",
    );
  }

  async submit(dto: ContactDto, ip: string) {
    if (dto.website?.trim()) {
      return {
        success: true,
        message: "Mensagem enviada com sucesso!",
      };
    }

    if (!dto.privacyConsent) {
      throw new BadRequestException("É necessário aceitar a política de privacidade.");
    }

    if (!(await this.limiter.allow(ip))) {
      throw new HttpException(
        "Demasiados pedidos. Tenta mais tarde.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const emailKey = dto.email.trim().toLowerCase();
    if (!(await this.emailLimiter.allow(emailKey))) {
      throw new HttpException(
        "Demasiados pedidos para este email. Tenta mais tarde.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const kind = dto.kind === "ENROLLMENT" ? ContactKind.ENROLLMENT : ContactKind.GENERAL;
    const row = await this.contacts.save(
      this.contacts.create({
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
      }),
    );
    await this.queue.add(
      "send",
      { contactId: row.id },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    );
    return {
      success: true,
      message:
        kind === ContactKind.ENROLLMENT
          ? "Pedido de inscrição enviado! Entraremos em contacto em breve."
          : "Mensagem enviada com sucesso!",
    };
  }

  async list(page = 1, pageSize = 50) {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * take;
    const [items, total] = await this.contacts.findAndCount({
      where: { erasedAt: IsNull() },
      order: { createdAt: "DESC" },
      skip,
      take,
    });
    return { items, total, page: safePage, pageSize: take };
  }

  async update(
    id: string,
    dto: { read?: boolean; adminNotes?: string },
  ) {
    const existing = await this.requireActive(id);
    if (dto.read === true) existing.readAt = new Date();
    if (dto.read === false) existing.readAt = null;
    if (dto.adminNotes !== undefined) existing.adminNotes = dto.adminNotes;
    return this.contacts.save(existing);
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
        adminNotes: contact.adminNotes,
        privacyConsent: contact.privacyConsent,
        consentAt: contact.consentAt,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      },
    };
  }

  async eraseGdpr(id: string) {
    const existing = await this.requireActive(id);
    existing.name = "Apagado (RGPD)";
    existing.email = `erased-${existing.id}@anon.corujinha.local`;
    existing.phone = null;
    existing.message = "[apagado]";
    existing.subject = null;
    existing.schoolYear = null;
    existing.location = null;
    existing.adminNotes = null;
    existing.privacyConsent = false;
    existing.consentAt = null;
    existing.erasedAt = new Date();
    await this.contacts.save(existing);
    return { ok: true };
  }

  /**
   * Anonymize contact messages older than the retention window (B7).
   * Batched to avoid long transactions; safe to run daily.
   */
  async eraseExpired(retentionMonths?: number) {
    const months =
      retentionMonths ??
      (Number(process.env.CONTACT_RETENTION_MONTHS) || CONTACT_RETENTION_MONTHS_DEFAULT);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - Math.max(1, months));

    const stale = await this.contacts.find({
      where: { erasedAt: IsNull(), createdAt: LessThan(cutoff) },
      select: { id: true },
      take: 500,
      order: { createdAt: "ASC" },
    });

    let erased = 0;
    for (const row of stale) {
      await this.eraseGdpr(row.id);
      erased += 1;
    }

    return { erased, cutoff: cutoff.toISOString(), retentionMonths: months };
  }

  private async requireActive(id: string) {
    const existing = await this.contacts.findOneBy({ id });
    if (!existing || existing.erasedAt) {
      throw new NotFoundException("Contacto não encontrado");
    }
    return existing;
  }
}
