import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthController } from "./auth.controller";
import { mockRepo } from "../test/mocks";

describe("AuthController", () => {
  let users: ReturnType<typeof mockRepo>;
  let controller: AuthController;

  beforeEach(() => {
    vi.clearAllMocks();
    users = mockRepo();
    controller = new AuthController(users as never);
  });

  it("me returns user from repository", async () => {
    const user = { id: "u1", email: "a@b.com", name: "A", role: "ADMIN" };
    users.findOne.mockResolvedValue(user);
    expect(await controller.me({ id: "u1" } as never)).toEqual({ user });
  });

  it("updateProfile updates name/image", async () => {
    const user = { id: "u1", name: "Nova", image: "img", email: "a@b.com", role: "ADMIN", mustChangePassword: false };
    users.findOneByOrFail.mockResolvedValue({ ...user });
    users.save.mockResolvedValue(user);
    expect(
      await controller.updateProfile({ id: "u1" } as never, { name: "Nova", image: "img" }),
    ).toEqual({ user });
  });
});
