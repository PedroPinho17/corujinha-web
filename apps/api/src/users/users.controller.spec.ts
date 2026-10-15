import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed"),
}));

import { UsersController } from "./users.controller";
import { UserRole } from "@corujinha/database";

describe("UsersController", () => {
  const prisma = {
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "1", email: "a@b.com" }),
      update: vi.fn().mockResolvedValue({ id: "1", email: "a@b.com" }),
      delete: vi.fn().mockResolvedValue({ id: "2" }),
    },
    account: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  let controller: UsersController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new UsersController(prisma as never);
  });

  it("list and create with default password", async () => {
    expect(await controller.list()).toEqual([]);
    await controller.create({ name: "Ed", email: "ed@example.com" });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: UserRole.EDITOR,
          mustChangePassword: true,
          accounts: expect.objectContaining({
            create: expect.objectContaining({ password: "hashed" }),
          }),
        }),
      }),
    );
  });

  it("update with optional password rotation", async () => {
    prisma.account.findFirst.mockResolvedValue({ id: "acc1" });
    await controller.update("1", {
      name: "Ed",
      email: "ed@example.com",
      password: "NewPassword123!",
      role: UserRole.ADMIN,
    });
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: "acc1" },
      data: { password: "hashed" },
    });

    prisma.account.findFirst.mockResolvedValue(null);
    await controller.update("1", { name: "Ed", email: "ed@example.com" });
  });

  it("remove blocks self-delete", async () => {
    expect(await controller.remove("me", { id: "me" } as never)).toEqual({
      success: false,
      message: "Não pode apagar a própria conta",
    });
    expect(await controller.remove("other", { id: "me" } as never)).toEqual({ success: true });
  });
});
