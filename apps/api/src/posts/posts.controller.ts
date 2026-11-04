import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";
import { Post as PostEntity } from "@corujinha/database";
import { Repository } from "typeorm";
import { AdminGuard } from "../auth/auth.guard";
import { nextSortOrder } from "../common/sort-order";
import { RedisService } from "../redis/redis.service";

export class PostDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  content?: string;

  @IsOptional()
  // null (not undefined) so that clearing the field is persisted: save() skips undefined.
  @Transform(({ value }) => (value === "" ? null : value))
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  link?: string | null;

  @IsOptional()
  @IsString()
  phone?: string;

  /** Empty string from the admin form clears the field and must not fail @IsEmail. */
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  @IsEmail({}, { message: "Email inválido" })
  email?: string | null;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  imageKey?: string;

  @IsOptional()
  translations?: unknown;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ReorderDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];
}

@Controller()
export class PostsController {
  constructor(
    @InjectRepository(PostEntity) private readonly posts: Repository<PostEntity>,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:home", "public:posts", "public:posts:featured");
  }

  @Get("api/public/posts")
  async publicList() {
    const cached = await this.redis.getJson("public:posts");
    if (cached) return cached;
    const data = await this.posts.find({
      where: { published: true },
      order: { featured: "DESC", sortOrder: "ASC", publishedAt: "DESC" },
      select: {
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
      },
    });
    await this.redis.setJson("public:posts", data);
    return data;
  }

  @Get("api/public/posts/featured")
  async featured() {
    const cached = await this.redis.getJson("public:posts:featured");
    if (cached) return cached;
    const data = await this.posts.find({
      where: { published: true, featured: true },
      order: { sortOrder: "ASC" },
      select: {
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
      },
    });
    await this.redis.setJson("public:posts:featured", data);
    return data;
  }

  @Get("api/admin/posts")
  @UseGuards(AdminGuard)
  adminList() {
    return this.posts.find({
      order: { sortOrder: "ASC", createdAt: "DESC" },
    });
  }

  @Post("api/admin/posts")
  @UseGuards(AdminGuard)
  async create(@Body() dto: PostDto) {
    const sortOrder = dto.sortOrder ?? (await nextSortOrder(this.posts));
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
        sortOrder,
      }),
    );
    await this.bust();
    return row;
  }

  @Put("api/admin/posts/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: PostDto) {
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
      published: dto.published,
      sortOrder: dto.sortOrder,
    });
    const row = await this.posts.save(current);
    await this.bust();
    return row;
  }

  @Patch("api/admin/posts/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.posts.findOneByOrFail({ id });
    current.published = !current.published;
    current.publishedAt = current.published ? new Date() : current.publishedAt;
    const row = await this.posts.save(current);
    await this.bust();
    return row;
  }

  @Patch("api/admin/posts/:id/feature")
  @UseGuards(AdminGuard)
  async feature(@Param("id") id: string) {
    const current = await this.posts.findOneByOrFail({ id });
    current.featured = !current.featured;
    const row = await this.posts.save(current);
    await this.bust();
    return row;
  }

  @Post("api/admin/posts/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.posts.manager.transaction(async (em) => {
      const repo = em.getRepository(PostEntity);
      for (const [index, id] of dto.ids.entries()) {
        await repo.update({ id }, { sortOrder: index + 1 });
      }
    });
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/posts/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.posts.findOneByOrFail({ id });
    await this.posts.delete({ id });
    await this.bust();
    return { success: true };
  }
}
