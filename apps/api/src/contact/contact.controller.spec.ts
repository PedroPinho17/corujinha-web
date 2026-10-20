import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { ContactController } from "./contact.controller";

describe("ContactController", () => {
  const contacts = {
    submit: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    exportGdpr: vi.fn(),
    eraseGdpr: vi.fn(),
  };
  let controller: ContactController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new ContactController(contacts as never);
  });

  it("submit passes dto and client ip", async () => {
    contacts.submit.mockResolvedValue({ success: true });
    const dto = { name: "Ana", email: "a@b.com", message: "hello!", privacyConsent: true };
    await controller.submit(dto as never, { socket: { remoteAddress: "1.2.3.4" } });
    expect(contacts.submit).toHaveBeenCalledWith(dto, "1.2.3.4");
  });

  it("list/update/export/erase delegate", async () => {
    contacts.list.mockResolvedValue([]);
    contacts.update.mockResolvedValue({ id: "1" });
    contacts.exportGdpr.mockResolvedValue({ format: "v1" });
    contacts.eraseGdpr.mockResolvedValue({ ok: true });

    expect(await controller.list()).toEqual([]);
    await controller.update("1", { read: true });
    expect(contacts.update).toHaveBeenCalledWith("1", { read: true });

    const res = { setHeader: vi.fn() };
    expect(await controller.gdprExport("1", res as never)).toEqual({ format: "v1" });
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json; charset=utf-8",
    );

    expect(() => controller.erase("1", {})).toThrow(BadRequestException);
    expect(await controller.erase("1", { confirm: true })).toEqual({ ok: true });
  });
});
