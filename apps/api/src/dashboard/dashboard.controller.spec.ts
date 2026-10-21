import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardController } from "./dashboard.controller";
import { mockPrisma, mockRedis } from "../test/mocks";

describe("DashboardController", () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: DashboardController;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = mockPrisma();
    redis = mockRedis();
    controller = new DashboardController(prisma as never, redis as never);
  });

  it("home returns cache hit", async () => {
    redis.getJson.mockResolvedValue({ posts: [] });
    expect(await controller.home()).toEqual({ posts: [] });
    expect(prisma.formation.findMany).not.toHaveBeenCalled();
  });

  it("home aggregates and caches", async () => {
    const data = await controller.home();
    expect(data).toHaveProperty("formations");
    expect(data).toHaveProperty("settings");
    expect(redis.setJson).toHaveBeenCalledWith("public:home", expect.any(Object));
  });

  it("dashboard returns counts excluding erased contacts", async () => {
    prisma.user.count.mockResolvedValue(2);
    prisma.teamMember.count.mockResolvedValue(3);
    prisma.post.count.mockResolvedValue(4);
    prisma.formation.count.mockResolvedValue(5);
    prisma.schoolProtocol.count.mockResolvedValue(1);
    prisma.contactMessage.count.mockResolvedValueOnce(6).mockResolvedValueOnce(1);
    prisma.contactMessage.findMany.mockResolvedValue([{ id: "c1" }]);
    const res = await controller.dashboard();
    expect(res.users).toBe(2);
    expect(res.unreadContacts).toBe(1);
    expect(res.recentContacts).toHaveLength(1);
    expect(prisma.contactMessage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { erasedAt: null } }),
    );
    expect(prisma.contactMessage.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ erasedAt: null }) }),
    );
  });
});
