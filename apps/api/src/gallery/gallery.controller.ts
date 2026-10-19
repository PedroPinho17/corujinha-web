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
  @IsString()
  centerId?: string | null;

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

  private galleryInclude = { center: true } as const;

  private async resolveCenterId(album?: string, centerId?: string | null) {
    if (centerId) return centerId;
    if (!album) return null;
    const legacy: Record<string, string> = {
      caldas: "lobao",
      lobão: "lobao",
      "sao-joao": "sao-joao-de-ver",
    };
    const slug = legacy[album] ?? album;
    const center = await this.prisma.center.findUnique({ where: { slug } });
    return center?.id ?? null;
  }

  @Get("api/public/gallery")
  async publicList() {
    const cached = await this.redis.getJson("public:gallery");
    if (cached) return cached;
    const data = await this.prisma.galleryImage.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      include: this.galleryInclude,
    });
    await this.redis.setJson("public:gallery", data);
    return data;
  }

  @Get("api/admin/gallery")
  @UseGuards(AdminGuard)
  adminList() {
    return this.prisma.galleryImage.findMany({
      orderBy: { sortOrder: "asc" },
      include: this.galleryInclude,
    });
  }

  @Post("api/admin/gallery")
  @UseGuards(AdminGuard)
  async create(@Body() dto: GalleryDto) {
    const max = await this.prisma.galleryImage.aggregate({ _max: { sortOrder: true } });
    const centerId = await this.resolveCenterId(dto.album, dto.centerId);
    const row = await this.prisma.galleryImage.create({
      data: {
        imageKey: dto.imageKey,
        alt: dto.alt,
        album: dto.album,
        centerId,
        published: dto.published ?? true,
        sortOrder: dto.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      },
      include: this.galleryInclude,
    });
    await this.bust();
    return row;
  }

  @Put("api/admin/gallery/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: GalleryDto) {
    const centerId = await this.resolveCenterId(dto.album, dto.centerId);
    const row = await this.prisma.galleryImage.update({
      where: { id },
      data: {
        imageKey: dto.imageKey,
        alt: dto.alt,
        album: dto.album,
        centerId,
        published: dto.published,
        sortOrder: dto.sortOrder,
      },
      include: this.galleryInclude,
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
