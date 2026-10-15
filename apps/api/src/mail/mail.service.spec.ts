import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendMail, createTransport } = vi.hoisted(() => {
  const sendMail = vi.fn().mockResolvedValue({});
  const createTransport = vi.fn(() => ({ sendMail }));
  return { sendMail, createTransport };
});

vi.mock("nodemailer", () => ({
  createTransport,
}));

describe("MailService", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...prev };
    delete process.env.SMTP_HOST;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("logs when SMTP is not configured", async () => {
    const { MailService } = await import("./mail.service");
    const svc = new MailService();
    await svc.send({ to: "a@b.com", subject: "S", text: "body" });
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("sends via transporter when SMTP is configured", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "u";
    process.env.SMTP_PASS = "p";
    process.env.SMTP_FROM = "from@example.com";
    const { MailService } = await import("./mail.service");
    const svc = new MailService();
    await svc.send({
      to: "a@b.com",
      subject: "S",
      text: "body",
      html: "<p>x</p>",
      replyTo: "r@b.com",
    });
    expect(createTransport).toHaveBeenCalled();
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@b.com", from: "from@example.com" }),
    );
    // reuse transporter
    await svc.send({ to: "c@d.com", subject: "S2", text: "t" });
    expect(createTransport).toHaveBeenCalledTimes(1);
  });
});
