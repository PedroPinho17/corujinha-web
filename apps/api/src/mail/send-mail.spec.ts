import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendMailMock, createTransport } = vi.hoisted(() => {
  const sendMailMock = vi.fn().mockResolvedValue({});
  const createTransport = vi.fn(() => ({ sendMail: sendMailMock }));
  return { sendMailMock, createTransport };
});

vi.mock("nodemailer", () => ({
  createTransport,
}));

describe("sendMail", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...prev };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_FROM;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("logs and returns logged when SMTP is missing", async () => {
    const { sendMail, resetMailTransporterForTests } = await import("./send-mail");
    resetMailTransporterForTests();
    await expect(
      sendMail({ to: "a@b.com", subject: "Reset", text: "link" }),
    ).resolves.toBe("logged");
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("sends email when SMTP is configured", async () => {
    process.env.SMTP_HOST = "smtp.example.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_FROM = "noreply@example.com";
    const { sendMail, resetMailTransporterForTests } = await import("./send-mail");
    resetMailTransporterForTests();
    await expect(
      sendMail({ to: "user@example.com", subject: "Recuperar password", text: "https://x" }),
    ).resolves.toBe("sent");
    expect(createTransport).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        from: "noreply@example.com",
        subject: "Recuperar password",
      }),
    );
  });
});
