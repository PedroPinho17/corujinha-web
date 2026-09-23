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
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { AdminGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

class PostDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

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
  ids!: string[];
}

@Controller()
export class PostsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:home", "public:posts", "public:posts:featured");
  }

  @Get("api/public/posts")
  async publicList() {
    const cached = await this.redis.getJson("public:posts");
    if (cached) return cached;
    const data = await this.prisma.post.findMany({
      where: { published: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }],
    });
    await this.redis.setJson("public:posts", data);
    return data;
  }

  @Get("api/public/posts/featured")
  async featured() {
    const cached = await this.redis.getJson("public:posts:featured");
    if (cached) return cached;
    const data = await this.prisma.post.findMany({
      where: { published: true, featured: true },
      orderBy: { sortOrder: "asc" },
    });
    await this.redis.setJson("public:posts:featured", data);
    return data;
  }

  @Get("api/admin/posts")
  @UseGuards(AdminGuard)
  adminList() {
    return this.prisma.post.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  @Post("api/admin/posts")
  @UseGuards(AdminGuard)
  async create(@Body() dto: PostDto) {
    const max = await this.prisma.post.aggregate({ _max: { sortOrder: true } });
    const row = await this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        link: dto.link,
        phone: dto.phone,
        email: dto.email,
        featured: dto.featured ?? false,
        imageKey: dto.imageKey,
        translations: dto.translations as object | undefined,
        published: dto.published ?? true,
        publishedAt: dto.published === false ? null : new Date(),
        sortOrder: dto.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      },
    });
    await this.bust();
    return row;
  }

  @Put("api/admin/posts/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: PostDto) {
    const row = await this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        link: dto.link,
        phone: dto.phone,
        email: dto.email,
        featured: dto.featured,
        imageKey: dto.imageKey,
        translations: dto.translations as object | undefined,
        published: dto.published,
        sortOrder: dto.sortOrder,
      },
    });
    await this.bust();
    return row;
  }

  @Patch("api/admin/posts/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.prisma.post.findUniqueOrThrow({ where: { id } });
    const row = await this.prisma.post.update({
      where: { id },
      data: {
        published: !current.published,
        publishedAt: !current.published ? new Date() : current.publishedAt,
      },
    });
    await this.bust();
    return row;
  }

  @Patch("api/admin/posts/:id/feature")
  @UseGuards(AdminGuard)
  async feature(@Param("id") id: string) {
    const current = await this.prisma.post.findUniqueOrThrow({ where: { id } });
    const row = await this.prisma.post.update({
      where: { id },
      data: { featured: !current.featured },
    });
    await this.bust();
    return row;
  }

  @Post("api/admin/posts/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.post.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/posts/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.prisma.post.delete({ where: { id } });
    await this.bust();
    return { success: true };
  }
}
