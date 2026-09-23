import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { AdminGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

class GalleryDto {
  @IsString()
  imageKey!: string;

  @IsOptional()
  @IsString()
  alt?: string;

  @IsOptional()
  @IsString()
  album?: string;

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
export class GalleryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:gallery", "public:home");
  }

  @Get("api/public/gallery")
  async publicList() {
    const cached = await this.redis.getJson("public:gallery");
    if (cached) return cached;
    const data = await this.prisma.galleryImage.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });
    await this.redis.setJson("public:gallery", data);
    return data;
  }

  @Get("api/admin/gallery")
  @UseGuards(AdminGuard)
  adminList() {
    return this.prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } });
  }

  @Post("api/admin/gallery")
  @UseGuards(AdminGuard)
  async create(@Body() dto: GalleryDto) {
    const max = await this.prisma.galleryImage.aggregate({ _max: { sortOrder: true } });
    const row = await this.prisma.galleryImage.create({
      data: {
        imageKey: dto.imageKey,
        alt: dto.alt,
        album: dto.album,
        published: dto.published ?? true,
        sortOrder: dto.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      },
    });
    await this.bust();
    return row;
  }

  @Put("api/admin/gallery/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: GalleryDto) {
    const row = await this.prisma.galleryImage.update({
      where: { id },
      data: {
        imageKey: dto.imageKey,
        alt: dto.alt,
        album: dto.album,
        published: dto.published,
        sortOrder: dto.sortOrder,
      },
    });
    await this.bust();
    return row;
  }

  @Post("api/admin/gallery/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.galleryImage.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/gallery/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.prisma.galleryImage.delete({ where: { id } });
    await this.bust();
    return { success: true };
  }
}
