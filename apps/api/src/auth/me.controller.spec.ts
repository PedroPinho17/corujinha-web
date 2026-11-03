import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";

const { changePassword } = vi.hoisted(() => ({
  changePassword: vi.fn(),
}));

vi.mock("./auth", () => ({
  auth: { api: { changePassword } },
}));

vi.mock("better-auth/node", () => ({
  fromNodeHeaders: (h: unknown) => h,
}));

import { MeController } from "./me.controller";
import { mockRepo } from "../test/mocks";

describe("MeController", () => {
  let users: ReturnType<typeof mockRepo>;
  let controller: MeController;

  beforeEach(() => {
    vi.clearAllMocks();
    users = mockRepo();
    controller = new MeController(users as never);
    changePassword.mockResolvedValue({});
    users.update.mockResolvedValue({});
  });

  it("rejects same or weak passwords", async () => {
    await expect(
      controller.changePassword(
        { id: "u1" } as never,
        { currentPassword: "SamePassword12", newPassword: "SamePassword12" },
        { headers: {} } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.changePassword(
        { id: "u1" } as never,
        { currentPassword: "OldPassword123!", newPassword: "password123!" },
        { headers: {} } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("changes password and clears mustChangePassword", async () => {
    const res = await controller.changePassword(
      { id: "u1" } as never,
      { currentPassword: "OldPassword123!", newPassword: "BrandNewPass99!" },
      { headers: { cookie: "x" } } as never,
    );
    expect(res).toEqual({ ok: true });
    expect(changePassword).toHaveBeenCalled();
    expect(users.update).toHaveBeenCalledWith({ id: "u1" }, { mustChangePassword: false });
  });
});
