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
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength } from "class-validator";
import { AdminGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

class EntityDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  website?: string;

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
export class EntitiesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:home", "public:entities", "public:formations");
  }

  @Get("api/public/entities")
  async publicList() {
    const cached = await this.redis.getJson("public:entities");
    if (cached) return cached;
    const data = await this.prisma.entity.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      include: { formations: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
    });
    await this.redis.setJson("public:entities", data);
    return data;
  }

  @Get("api/admin/entities")
  @UseGuards(AdminGuard)
  adminList() {
    return this.prisma.entity.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { formations: true } } },
    });
  }

  @Post("api/admin/entities")
  @UseGuards(AdminGuard)
  async create(@Body() dto: EntityDto) {
    const max = await this.prisma.entity.aggregate({ _max: { sortOrder: true } });
    const row = await this.prisma.entity.create({
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        website: dto.website,
        translations: dto.translations as object | undefined,
        published: dto.published ?? true,
        sortOrder: dto.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      },
    });
    await this.bust();
    return row;
  }

  @Put("api/admin/entities/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: EntityDto) {
    const row = await this.prisma.entity.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        location: dto.location,
        website: dto.website,
        translations: dto.translations as object | undefined,
        published: dto.published,
        sortOrder: dto.sortOrder,
      },
    });
    await this.bust();
    return row;
  }

  @Patch("api/admin/entities/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.prisma.entity.findUniqueOrThrow({ where: { id } });
    const row = await this.prisma.entity.update({
      where: { id },
      data: { published: !current.published },
    });
    await this.bust();
    return row;
  }

  @Post("api/admin/entities/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.entity.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/entities/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.prisma.entity.delete({ where: { id } });
    await this.bust();
    return { success: true };
  }
}
