import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException, HttpException, NotFoundException } from "@nestjs/common";
import { ContactService } from "./contact.service";
import { mockRepo } from "../test/mocks";

describe("ContactService", () => {
  let contacts: ReturnType<typeof mockRepo>;
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
    contacts = mockRepo();
    queue = { add: vi.fn().mockResolvedValue(undefined) };
    redis = {
      client: {
        get: vi.fn().mockResolvedValue(null),
        incr: vi.fn().mockResolvedValue(1),
        pexpire: vi.fn().mockResolvedValue(1),
      },
    };
    service = new ContactService(contacts as never, redis as never, queue as never);
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
    expect(contacts.save).not.toHaveBeenCalled();
  });

  it("rate limits by IP and by destination email, and requires privacyConsent", async () => {
    redis.client.get.mockResolvedValue("5");
    await expect(
      service.submit(
        { name: "A", email: "a@b.com", message: "hello!", privacyConsent: true } as never,
        "ip",
      ),
    ).rejects.toBeInstanceOf(HttpException);

    redis.client.get.mockResolvedValueOnce(null).mockResolvedValueOnce("3");
    await expect(
      service.submit(
        { name: "A", email: "flood@example.com", message: "hello!", privacyConsent: true } as never,
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

  it("rejects missing privacyConsent before spending rate-limit quota", async () => {
    await expect(
      service.submit(
        { name: "A", email: "a@b.com", message: "hello!", privacyConsent: false } as never,
        "ip",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(redis.client.get).not.toHaveBeenCalled();
    expect(redis.client.incr).not.toHaveBeenCalled();
  });

  it("creates GENERAL and ENROLLMENT messages", async () => {
    contacts.save.mockResolvedValue({ id: "c1" });
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
    expect(queue.add).toHaveBeenCalledWith(
      "send",
      { contactId: "c1" },
      expect.objectContaining({ attempts: 3 }),
    );

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
    expect(contacts.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: "ENROLLMENT", privacyConsent: true }),
    );
  });

  it("list/update/export/erase with requireActive", async () => {
    contacts.findAndCount.mockResolvedValue([[], 0]);
    expect(await service.list()).toEqual({ items: [], total: 0, page: 1, pageSize: 50 });

    contacts.findOneBy.mockResolvedValue(null);
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
    contacts.findOneBy.mockResolvedValue(row);
    contacts.save.mockResolvedValue(row);

    await service.update("1", { read: true, adminNotes: "ok" });
    await service.update("1", { read: false });
    const exported = await service.exportGdpr("1");
    expect(exported.format).toBe("corujinha-contact-gdpr-v1");
    expect(exported.contact.email).toBe("a@b.com");
    expect(exported.contact).toHaveProperty("adminNotes");

    expect(await service.eraseGdpr("1")).toEqual({ ok: true });
    expect(contacts.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Apagado (RGPD)",
        adminNotes: null,
        erasedAt: expect.any(Date),
      }),
    );

    contacts.findOneBy.mockResolvedValue({ ...row, erasedAt: new Date() });
    await expect(service.exportGdpr("1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("eraseExpired anonymizes messages older than retention window", async () => {
    contacts.find.mockResolvedValue([{ id: "old-1" }, { id: "old-2" }]);
    contacts.findOneBy
      .mockResolvedValueOnce({
        id: "old-1",
        erasedAt: null,
      })
      .mockResolvedValueOnce({
        id: "old-2",
        erasedAt: null,
      });
    contacts.save.mockResolvedValue({});

    const result = await service.eraseExpired(24);
    expect(result.erased).toBe(2);
    expect(result.retentionMonths).toBe(24);
    expect(contacts.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ erasedAt: expect.anything() }),
        take: 500,
      }),
    );
    expect(contacts.save).toHaveBeenCalledTimes(2);
  });
});
