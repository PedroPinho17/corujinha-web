import { beforeEach, describe, expect, it, vi } from "vitest";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { AdminGuard, SuperAdminGuard } from "../auth/auth.guard";
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
    const user = { id: "admin-1" } as never;
    expect(await controller.gdprExport("1", res as never, user)).toEqual({ format: "v1" });
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/json; charset=utf-8",
    );

    expect(await controller.erase("1", { confirm: true }, user)).toEqual({ ok: true });
  });

  it("restricts RGPD export and erase to ADMIN; EDITOR keeps the contact list", () => {
    const guards = (name: keyof ContactController) =>
      Reflect.getMetadata(GUARDS_METADATA, ContactController.prototype[name]);
    expect(guards("gdprExport")).toEqual([SuperAdminGuard]);
    expect(guards("erase")).toEqual([SuperAdminGuard]);
    expect(guards("list")).toEqual([AdminGuard]);
  });
});
