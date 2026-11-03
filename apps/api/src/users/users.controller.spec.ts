import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException, ForbiddenException } from "@nestjs/common";

vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed"),
}));

import { UsersController } from "./users.controller";
import { UserRole } from "@corujinha/database";
import { mockRepo } from "../test/mocks";

describe("UsersController", () => {
  let users: ReturnType<typeof mockRepo>;
  let accounts: ReturnType<typeof mockRepo>;
  let sessions: ReturnType<typeof mockRepo>;
  let txUserRepo: ReturnType<typeof mockRepo>;
  let txAccountRepo: ReturnType<typeof mockRepo>;
  let controller: UsersController;

  beforeEach(() => {
    vi.clearAllMocks();
    users = mockRepo();
    accounts = mockRepo();
    sessions = mockRepo();
    txUserRepo = mockRepo();
    txAccountRepo = mockRepo();
    txUserRepo.save.mockImplementation(async (u: object) => ({
      id: "1",
      ...(u as object),
    }));
    let repoCall = 0;
    users.manager.transaction.mockImplementation(async (cb: (em: { getRepository: () => unknown }) => unknown) => {
      repoCall = 0;
      return cb({
        getRepository: () => {
          repoCall += 1;
          return repoCall === 1 ? txUserRepo : txAccountRepo;
        },
      });
    });
    users.count.mockResolvedValue(2);
    controller = new UsersController(users as never, accounts as never, sessions as never);
  });

  it("list and create requires password (no default)", async () => {
    expect(await controller.list()).toEqual([]);
    await controller.create({
      name: "Ed",
      email: "ed@example.com",
      password: "SecurePass12!",
    });
    expect(txUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        role: UserRole.EDITOR,
        mustChangePassword: true,
        email: "ed@example.com",
      }),
    );
    expect(txAccountRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        password: "hashed",
        providerId: "credential",
      }),
    );
  });

  it("update with optional password rotation revokes sessions", async () => {
    users.findOneByOrFail.mockResolvedValue({
      id: "1",
      role: UserRole.EDITOR,
      email: "ed@example.com",
    });
    accounts.findOne.mockResolvedValue({ id: "acc1", password: "old" });
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
    expect(accounts.save).toHaveBeenCalledWith(
      expect.objectContaining({ password: "hashed" }),
    );
    expect(sessions.delete).toHaveBeenCalledWith({ userId: "1" });

    accounts.findOne.mockResolvedValue(null);
    sessions.delete.mockClear();
    await controller.update(
      "1",
      { name: "Ed", email: "ed@example.com" },
      { id: "me" } as never,
    );
    expect(sessions.delete).not.toHaveBeenCalled();
  });

  it("remove blocks self-delete with 403", async () => {
    await expect(controller.remove("me", { id: "me" } as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("remove blocks last admin", async () => {
    users.findOneByOrFail.mockResolvedValue({ id: "other", role: UserRole.ADMIN });
    users.count.mockResolvedValue(1);
    await expect(controller.remove("other", { id: "me" } as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("remove succeeds for non-self non-last-admin", async () => {
    users.findOneByOrFail.mockResolvedValue({ id: "other", role: UserRole.EDITOR });
    expect(await controller.remove("other", { id: "me" } as never)).toEqual({ success: true });
  });

  it("update blocks demoting self", async () => {
    users.findOneByOrFail.mockResolvedValue({
      id: "me",
      role: UserRole.ADMIN,
      email: "me@example.com",
    });
    await expect(
      controller.update(
        "me",
        { name: "Me", email: "me@example.com", role: UserRole.EDITOR },
        { id: "me" } as never,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("update blocks demoting last admin", async () => {
    users.findOneByOrFail.mockResolvedValue({
      id: "other",
      role: UserRole.ADMIN,
      email: "o@example.com",
    });
    users.count.mockResolvedValue(1);
    await expect(
      controller.update(
        "other",
        { name: "Other", email: "o@example.com", role: UserRole.EDITOR },
        { id: "me" } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
