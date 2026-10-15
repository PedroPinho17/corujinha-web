import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  let controller: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AuthController(prisma as never);
  });

  it("me returns user from prisma", async () => {
    const user = { id: "u1", email: "a@b.com", name: "A", role: "ADMIN" };
    prisma.user.findUnique.mockResolvedValue(user);
    expect(await controller.me({ id: "u1" } as never)).toEqual({ user });
  });

  it("updateProfile updates name/image", async () => {
    const user = { id: "u1", name: "Nova", image: "img" };
    prisma.user.update.mockResolvedValue(user);
    expect(
      await controller.updateProfile({ id: "u1" } as never, { name: "Nova", image: "img" }),
    ).toEqual({ user });
  });
});
