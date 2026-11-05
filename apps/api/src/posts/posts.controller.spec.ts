import { beforeEach, describe, expect, it, vi } from "vitest";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PostsController } from "./posts.controller";
import { PostDto } from "./posts.dto";
import { PostsService } from "./posts.service";
import { mockRedis, mockRepo } from "../test/mocks";

describe("PostDto", () => {
  it("turns empty link/email into null so clearing them is persisted", async () => {
    const dto = plainToInstance(PostDto, { title: "T", link: "", email: "" });
    expect(dto.link).toBeNull();
    expect(dto.email).toBeNull();
    expect(await validate(dto)).toEqual([]);
  });

  it("still rejects an invalid link or email", async () => {
    const dto = plainToInstance(PostDto, { title: "T", link: "http://x.pt", email: "nope" });
    const props = (await validate(dto)).map((e) => e.property);
    expect(props).toEqual(expect.arrayContaining(["link", "email"]));
  });
});

describe("PostsController", () => {
  let posts: ReturnType<typeof mockRepo>;
  let redis: ReturnType<typeof mockRedis>;
  let controller: PostsController;

  beforeEach(() => {
    vi.clearAllMocks();
    posts = mockRepo({ query: vi.fn().mockResolvedValue([]) });
    redis = mockRedis();
    controller = new PostsController(new PostsService(posts as never, redis as never));
  });

  it("public list and featured with cache", async () => {
    redis.getJson.mockResolvedValueOnce([{ id: "cached" }]);
    expect(await controller.publicList()).toEqual([{ id: "cached" }]);
    redis.getJson.mockResolvedValueOnce(null);
    posts.find.mockResolvedValue([{ id: "1" }]);
    expect(await controller.publicList()).toEqual([{ id: "1" }]);

    redis.getJson.mockResolvedValueOnce(null);
    posts.find.mockResolvedValue([{ id: "f" }]);
    expect(await controller.featured()).toEqual([{ id: "f" }]);
    expect(redis.setJson).toHaveBeenCalledWith("public:posts:featured", [{ id: "f" }]);
  });

  it("sets publishedAt when an update publishes a hidden post, and keeps it otherwise", async () => {
    const old = new Date("2026-01-01");
    posts.findOneByOrFail.mockResolvedValueOnce({ id: "1", published: false, publishedAt: null });
    await controller.update("1", { title: "T", published: true });
    expect(posts.save.mock.calls[0][0].publishedAt).toBeInstanceOf(Date);

    posts.findOneByOrFail.mockResolvedValueOnce({ id: "2", published: true, publishedAt: old });
    await controller.update("2", { title: "T", published: true });
    expect(posts.save.mock.calls[1][0].publishedAt).toBe(old);

    posts.findOneByOrFail.mockResolvedValueOnce({ id: "3", published: true, publishedAt: old });
    await controller.update("3", { title: "T" });
    expect(posts.save.mock.calls[2][0].published).toBe(true);
  });

  it("reorders with one statement and clears the public cache", async () => {
    await controller.reorder({ ids: ["a", "b", "c"] });
    expect(posts.query).toHaveBeenCalledTimes(1);
    expect(posts.query.mock.calls[0][1]).toEqual([["a", "b", "c"]]);
    expect(redis.del).toHaveBeenCalled();
    posts.query.mockClear();
    await controller.reorder({ ids: [] });
    expect(posts.query).not.toHaveBeenCalled();
  });

  it("admin create/update/toggle/feature/reorder/remove", async () => {
    expect(await controller.adminList()).toEqual([]);
    await controller.create({ title: "T", published: false });
    await controller.create({ title: "T2" });
    await controller.update("1", { title: "U", featured: true });

    posts.findOneByOrFail
      .mockResolvedValueOnce({ id: "1", published: false, publishedAt: null })
      .mockResolvedValueOnce({ id: "1", featured: false });
    posts.save
      .mockResolvedValueOnce({ id: "1", published: true })
      .mockResolvedValueOnce({ id: "1", featured: true });
    await controller.toggle("1");
    await controller.feature("1");
    expect(await controller.reorder({ ids: ["1", "2"] })).toEqual({ success: true });
    expect(await controller.remove("1")).toEqual({ success: true });
  });
});
