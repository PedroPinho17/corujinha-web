import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException, HttpException, NotFoundException } from "@nestjs/common";
import { ContactService } from "./contact.service";
import { mockPrisma } from "../test/mocks";

describe("ContactService", () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let queue: { add: ReturnType<typeof vi.fn> };
  let redis: {
    client: {
      get: ReturnType<typeof vi.fn>;
      incr: ReturnType<typeof vi.fn>;
      pexpire: ReturnType<typeof vi.fn>;
    };
  };
  let service: ContactService;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = mockPrisma();
    queue = { add: vi.fn().mockResolvedValue(undefined) };
    redis = {
      client: {
        get: vi.fn().mockResolvedValue(null),
        incr: vi.fn().mockResolvedValue(1),
        pexpire: vi.fn().mockResolvedValue(1),
      },
    };
    service = new ContactService(prisma as never, redis as never, queue as never);
  });

  it("honeypot returns success without persisting", async () => {
    const res = await service.submit(
      {
        name: "Bot",
        email: "b@e.com",
        message: "spammm",
        privacyConsent: true,
        website: "http://x",
      } as never,
      "1.1.1.1",
    );
    expect(res.success).toBe(true);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  it("rate limits and requires privacyConsent", async () => {
    // check() reads current count — at/over limit blocks without incrementing.
    redis.client.get.mockResolvedValue("5");
    await expect(
      service.submit(
        { name: "A", email: "a@b.com", message: "hello!", privacyConsent: true } as never,
        "ip",
      ),
    ).rejects.toBeInstanceOf(HttpException);

    redis.client.get.mockResolvedValue(null);
    redis.client.incr.mockResolvedValue(1);
    await expect(
      service.submit(
        { name: "A", email: "a@b.com", message: "hello!", privacyConsent: false } as never,
        "ip",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates GENERAL and ENROLLMENT messages", async () => {
    prisma.contactMessage.create.mockResolvedValue({ id: "c1" });
    const general = await service.submit(
      {
        name: "Ana",
        email: "ana@example.com",
        message: "Olá equipa",
        privacyConsent: true,
      } as never,
      "9.9.9.9",
    );
    expect(general.message).toMatch(/sucesso/);
    expect(queue.add).toHaveBeenCalledWith("send", { contactId: "c1" });

    const enroll = await service.submit(
      {
        name: "Ana",
        email: "ana@example.com",
        message: "Quero inscrição",
        privacyConsent: true,
        kind: "ENROLLMENT",
        subject: "Português",
        schoolYear: "5º",
        location: "Lisboa",
        phone: "911",
      } as never,
      "9.9.9.9",
    );
    expect(enroll.message).toMatch(/inscrição/);
    expect(prisma.contactMessage.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ kind: "ENROLLMENT", privacyConsent: true }),
      }),
    );
  });

  it("list/update/export/erase with requireActive", async () => {
    prisma.contactMessage.findMany.mockResolvedValue([]);
    expect(await service.list()).toEqual([]);

    prisma.contactMessage.findUnique.mockResolvedValue(null);
    await expect(service.update("x", { read: true })).rejects.toBeInstanceOf(NotFoundException);

    const row = {
      id: "1",
      name: "Ana",
      email: "a@b.com",
      phone: null,
      message: "hi there",
      kind: "GENERAL",
      subject: null,
      schoolYear: null,
      location: null,
      status: "NEW",
      privacyConsent: true,
      consentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      erasedAt: null,
    };
    prisma.contactMessage.findUnique.mockResolvedValue(row);
    prisma.contactMessage.update.mockResolvedValue(row);

    await service.update("1", { read: true, adminNotes: "ok" });
    await service.update("1", { read: false });
    const exported = await service.exportGdpr("1");
    expect(exported.format).toBe("corujinha-contact-gdpr-v1");
    expect(exported.contact.email).toBe("a@b.com");

    expect(await service.eraseGdpr("1")).toEqual({ ok: true });
    expect(prisma.contactMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Apagado (RGPD)", erasedAt: expect.any(Date) }),
      }),
    );

    prisma.contactMessage.findUnique.mockResolvedValue({ ...row, erasedAt: new Date() });
    await expect(service.exportGdpr("1")).rejects.toBeInstanceOf(NotFoundException);
  });
});
