import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException, ForbiddenException } from "@nestjs/common";

vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed"),
}));

import { UsersController } from "./users.controller";
import { UserRole } from "@corujinha/database";

describe("UsersController", () => {
  const prisma = {
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: "1", email: "a@b.com" }),
      update: vi.fn().mockResolvedValue({ id: "1", email: "a@b.com" }),
      delete: vi.fn().mockResolvedValue({ id: "2" }),
      count: vi.fn().mockResolvedValue(2),
    },
    account: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };
  let controller: UsersController;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.count.mockResolvedValue(2);
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
    prisma.user.findUniqueOrThrow.mockResolvedValue({ id: "1", role: UserRole.EDITOR });
    prisma.account.findFirst.mockResolvedValue({ id: "acc1" });
    await controller.update(
      "1",
      {
        name: "Ed",
        email: "ed@example.com",
        password: "NewPassword123!",
        role: UserRole.ADMIN,
      },
      { id: "me" } as never,
    );
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: "acc1" },
      data: { password: "hashed" },
    });

    prisma.account.findFirst.mockResolvedValue(null);
    await controller.update("1", { name: "Ed", email: "ed@example.com" }, { id: "me" } as never);
  });

  it("remove blocks self-delete with 403", async () => {
    await expect(controller.remove("me", { id: "me" } as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("remove blocks last admin", async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({ id: "other", role: UserRole.ADMIN });
    prisma.user.count.mockResolvedValue(1);
    await expect(controller.remove("other", { id: "me" } as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("remove succeeds for non-self non-last-admin", async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({ id: "other", role: UserRole.EDITOR });
    expect(await controller.remove("other", { id: "me" } as never)).toEqual({ success: true });
  });

  it("update blocks demoting self", async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({ id: "me", role: UserRole.ADMIN });
    await expect(
      controller.update(
        "me",
        { name: "Me", email: "me@example.com", role: UserRole.EDITOR },
        { id: "me" } as never,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("update blocks demoting last admin", async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({ id: "other", role: UserRole.ADMIN });
    prisma.user.count.mockResolvedValue(1);
    await expect(
      controller.update(
        "other",
        { name: "Other", email: "o@example.com", role: UserRole.EDITOR },
        { id: "me" } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
