import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardController } from "./dashboard.controller";
import { mockRedis, mockRepo } from "../test/mocks";

describe("DashboardController", () => {
  let formations: ReturnType<typeof mockRepo>;
  let teamMembers: ReturnType<typeof mockRepo>;
  let posts: ReturnType<typeof mockRepo>;
  let protocols: ReturnType<typeof mockRepo>;
  let gallery: ReturnType<typeof mockRepo>;
  let centers: ReturnType<typeof mockRepo>;
  let settings: ReturnType<typeof mockRepo>;
  let users: ReturnType<typeof mockRepo>;
  let contacts: ReturnType<typeof mockRepo>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: DashboardController;

  beforeEach(() => {
    vi.clearAllMocks();
    formations = mockRepo();
    teamMembers = mockRepo();
    posts = mockRepo();
    protocols = mockRepo();
    gallery = mockRepo();
    centers = mockRepo();
    settings = mockRepo();
    users = mockRepo();
    contacts = mockRepo();
    redis = mockRedis();
    controller = new DashboardController(
      formations as never,
      teamMembers as never,
      posts as never,
      protocols as never,
      gallery as never,
      centers as never,
      settings as never,
      users as never,
      contacts as never,
      redis as never,
    );
  });

  it("home returns cache hit", async () => {
    redis.getJson.mockResolvedValue({ posts: [] });
    expect(await controller.home()).toEqual({ posts: [] });
    expect(formations.find).not.toHaveBeenCalled();
  });

  it("home aggregates and caches", async () => {
    const data = await controller.home();
    expect(data).toHaveProperty("formations");
    expect(data).toHaveProperty("settings");
    expect(redis.setJson).toHaveBeenCalledWith("public:home", expect.any(Object));
  });

  it("dashboard returns counts excluding erased contacts", async () => {
    users.count.mockResolvedValue(2);
    teamMembers.count.mockResolvedValue(3);
    posts.count.mockResolvedValue(4);
    formations.count.mockResolvedValue(5);
    protocols.count.mockResolvedValue(1);
    contacts.count.mockResolvedValueOnce(6).mockResolvedValueOnce(1);
    contacts.find.mockResolvedValue([{ id: "c1" }]);
    const res = await controller.dashboard();
    expect(res.users).toBe(2);
    expect(res.unreadContacts).toBe(1);
    expect(res.recentContacts).toHaveLength(1);
    expect(contacts.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ erasedAt: expect.anything() }) }),
    );
    expect(contacts.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ erasedAt: expect.anything() }) }),
    );
  });
});
