import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContactProcessor } from "./contact.processor";

describe("ContactProcessor", () => {
  const prisma = {
    contactMessage: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  const mail = { send: vi.fn() };
  let processor: ContactProcessor;
  const prevNotify = process.env.CONTACT_NOTIFY_TO;

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new ContactProcessor(prisma as never, mail as never);
    process.env.CONTACT_NOTIFY_TO = "notify@example.com";
  });

  afterEach(() => {
    if (prevNotify === undefined) delete process.env.CONTACT_NOTIFY_TO;
    else process.env.CONTACT_NOTIFY_TO = prevNotify;
  });

  it("no-ops when contact missing or erased", async () => {
    prisma.contactMessage.findUnique.mockResolvedValue(null);
    await processor.process({ data: { contactId: "1" } } as never);
    expect(mail.send).not.toHaveBeenCalled();

    prisma.contactMessage.findUnique.mockResolvedValue({ id: "1", erasedAt: new Date() });
    await processor.process({ data: { contactId: "1" } } as never);
    expect(mail.send).not.toHaveBeenCalled();
  });

  it("requires CONTACT_NOTIFY_TO", async () => {
    delete process.env.CONTACT_NOTIFY_TO;
    prisma.contactMessage.findUnique.mockResolvedValue({
      id: "1",
      erasedAt: null,
      kind: "GENERAL",
      name: "A",
      email: "a@b.com",
      message: "hi",
      privacyConsent: true,
    });
    await expect(processor.process({ data: { contactId: "1" } } as never)).rejects.toThrow(
      /CONTACT_NOTIFY_TO/,
    );
  });

  it("sends GENERAL and ENROLLMENT mail and marks SENT", async () => {
    const base = {
      id: "1",
      erasedAt: null,
      name: "Ana",
      email: "ana@example.com",
      phone: "911",
      message: "linha1\nlinha2",
      privacyConsent: true,
      subject: "Mat",
      schoolYear: "5º",
      location: "LX",
    };
    prisma.contactMessage.findUnique.mockResolvedValue({ ...base, kind: "GENERAL" });
    mail.send.mockResolvedValue(undefined);
    prisma.contactMessage.update.mockResolvedValue({});
    await processor.process({ data: { contactId: "1" } } as never);
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("Contacto") }),
    );

    prisma.contactMessage.findUnique.mockResolvedValue({ ...base, kind: "ENROLLMENT" });
    await processor.process({ data: { contactId: "1" } } as never);
    expect(mail.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("inscrição") }),
    );
    expect(prisma.contactMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "SENT" } }),
    );
  });

  it("marks FAILED and rethrows on mail error", async () => {
    prisma.contactMessage.findUnique.mockResolvedValue({
      id: "1",
      erasedAt: null,
      kind: "GENERAL",
      name: "A",
      email: "a@b.com",
      message: "hi",
      privacyConsent: false,
      phone: null,
      subject: null,
      schoolYear: null,
      location: null,
    });
    mail.send.mockRejectedValue(new Error("smtp down"));
    await expect(processor.process({ data: { contactId: "1" } } as never)).rejects.toThrow(
      /smtp down/,
    );
    expect(prisma.contactMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "FAILED" } }),
    );
  });
});
