import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Post as PostEntity } from "@corujinha/database";
import type { FindOptionsOrder, FindOptionsWhere, Repository } from "typeorm";
import { nextSortOrder } from "../common/sort-order";
import { RedisService } from "../redis/redis.service";
import type { PostDto } from "./posts.dto";

const PUBLIC_FIELDS = {
  id: true,
  title: true,
  content: true,
  link: true,
  phone: true,
  email: true,
  featured: true,
  imageKey: true,
  publishedAt: true,
  sortOrder: true,
} as const;

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity) private readonly posts: Repository<PostEntity>,
    private readonly redis: RedisService,
  ) {}

  private async invalidatePublicCache() {
    await this.redis.del("public:home", "public:posts", "public:posts:featured");
  }

  private async cachedPublicList(
    key: string,
    where: FindOptionsWhere<PostEntity>,
    order: FindOptionsOrder<PostEntity>,
  ) {
    const cached = await this.redis.getJson(key);
    if (cached) return cached;
    const data = await this.posts.find({ where, order, select: PUBLIC_FIELDS });
    await this.redis.setJson(key, data);
    return data;
  }

  /** A post gets its publication date whenever it goes from hidden to published. */
  private applyPublished(post: PostEntity, published: boolean) {
    if (published && !post.published) post.publishedAt = new Date();
    post.published = published;
  }

  publicList() {
    return this.cachedPublicList(
      "public:posts",
      { published: true },
      { featured: "DESC", sortOrder: "ASC", publishedAt: "DESC" },
    );
  }

  featured() {
    return this.cachedPublicList(
      "public:posts:featured",
      { published: true, featured: true },
      { sortOrder: "ASC" },
    );
  }

  adminList() {
    return this.posts.find({ order: { sortOrder: "ASC", createdAt: "DESC" } });
  }

  async create(dto: PostDto) {
    const row = await this.posts.save(
      this.posts.create({
        title: dto.title,
        content: dto.content,
        link: dto.link,
        phone: dto.phone,
        email: dto.email,
        featured: dto.featured ?? false,
        imageKey: dto.imageKey,
        translations: dto.translations as Record<string, unknown> | undefined,
        published: dto.published ?? true,
        publishedAt: dto.published === false ? null : new Date(),
        sortOrder: dto.sortOrder ?? (await nextSortOrder(this.posts)),
      }),
    );
    await this.invalidatePublicCache();
    return row;
  }

  async update(id: string, dto: PostDto) {
    const current = await this.posts.findOneByOrFail({ id });
    Object.assign(current, {
      title: dto.title,
      content: dto.content,
      link: dto.link,
      phone: dto.phone,
      email: dto.email,
      featured: dto.featured,
      imageKey: dto.imageKey,
      translations: dto.translations as Record<string, unknown> | undefined,
      sortOrder: dto.sortOrder,
    });
    if (dto.published !== undefined) this.applyPublished(current, dto.published);
    const row = await this.posts.save(current);
    await this.invalidatePublicCache();
    return row;
  }

  async toggle(id: string) {
    const current = await this.posts.findOneByOrFail({ id });
    this.applyPublished(current, !current.published);
    const row = await this.posts.save(current);
    await this.invalidatePublicCache();
    return row;
  }

  async feature(id: string) {
    const current = await this.posts.findOneByOrFail({ id });
    current.featured = !current.featured;
    const row = await this.posts.save(current);
    await this.invalidatePublicCache();
    return row;
  }

  /** One statement, whatever the list size. */
  async reorder(ids: string[]) {
    if (ids.length > 0) {
      await this.posts.query(
        `UPDATE "Post" AS p
            SET "sortOrder" = o.position, "updatedAt" = CURRENT_TIMESTAMP
           FROM unnest($1::text[]) WITH ORDINALITY AS o(id, position)
          WHERE p.id = o.id`,
        [ids],
      );
    }
    await this.invalidatePublicCache();
    return { success: true };
  }

  async remove(id: string) {
    await this.posts.findOneByOrFail({ id });
    await this.posts.delete({ id });
    await this.invalidatePublicCache();
    return { success: true };
  }
}
