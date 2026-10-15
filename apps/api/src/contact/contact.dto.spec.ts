import { describe, expect, it } from "vitest";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { ContactDto, UpdateContactDto } from "./contact.dto";

describe("ContactDto", () => {
  it("requires privacyConsent true and valid fields", async () => {
    const bad = plainToInstance(ContactDto, {
      name: "A",
      email: "not-email",
      message: "hi",
      privacyConsent: false,
    });
    expect((await validate(bad)).length).toBeGreaterThan(0);

    const ok = plainToInstance(ContactDto, {
      name: "Ana Silva",
      email: "ana@example.com",
      message: "Quero inscrição no apoio",
      privacyConsent: true,
      kind: "ENROLLMENT",
    });
    expect(await validate(ok)).toHaveLength(0);
  });

  it("allows honeypot website field", async () => {
    const dto = plainToInstance(ContactDto, {
      name: "Bot",
      email: "bot@example.com",
      message: "spam message here",
      privacyConsent: true,
      website: "http://spam.example",
    });
    expect(await validate(dto)).toHaveLength(0);
  });
});

describe("UpdateContactDto", () => {
  it("accepts read and notes", async () => {
    const dto = plainToInstance(UpdateContactDto, { read: true, adminNotes: "ok" });
    expect(await validate(dto)).toHaveLength(0);
  });
});
