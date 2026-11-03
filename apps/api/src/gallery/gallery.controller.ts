import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString } from "class-validator";
import { Center, GalleryImage } from "@corujinha/database";
import { Repository } from "typeorm";
import { AdminGuard } from "../auth/auth.guard";
import { nextSortOrder } from "../common/sort-order";
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
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];
}

@Controller()
export class GalleryController {
  constructor(
    @InjectRepository(GalleryImage) private readonly gallery: Repository<GalleryImage>,
    @InjectRepository(Center) private readonly centers: Repository<Center>,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:gallery", "public:home");
  }

  private pickCenter(center: Center | null | undefined) {
    if (!center) return null;
    return {
      id: center.id,
      slug: center.slug,
      name: center.name,
      shortName: center.shortName,
    };
  }

  private async resolveCenterId(album?: string, centerId?: string | null) {
    if (centerId) return centerId;
    if (!album) return null;
    const legacy: Record<string, string> = {
      caldas: "lobao",
      lobão: "lobao",
      "sao-joao": "sao-joao-de-ver",
    };
    const slug = legacy[album] ?? album;
    const center = await this.centers.findOneBy({ slug });
    return center?.id ?? null;
  }

  @Get("api/public/gallery")
  async publicList() {
    const cached = await this.redis.getJson("public:gallery");
    if (cached) return cached;
    const rows = await this.gallery.find({
      where: { published: true },
      order: { sortOrder: "ASC" },
      relations: { center: true },
    });
    const data = rows.map((g) => ({
      id: g.id,
      imageKey: g.imageKey,
      alt: g.alt,
      album: g.album,
      center: this.pickCenter(g.center),
    }));
    await this.redis.setJson("public:gallery", data);
    return data;
  }

  @Get("api/admin/gallery")
  @UseGuards(AdminGuard)
  async adminList(
    @Query("page") pageRaw?: string,
    @Query("pageSize") pageSizeRaw?: string,
  ) {
    const pageSize = Math.min(Math.max(Number(pageSizeRaw) || 50, 1), 100);
    const page = Math.max(Number(pageRaw) || 1, 1);
    const skip = (page - 1) * pageSize;
    const [items, total] = await this.gallery.findAndCount({
      order: { sortOrder: "ASC", id: "ASC" },
      skip,
      take: pageSize,
      relations: { center: true },
    });
    return {
      items: items.map((g) => ({ ...g, center: this.pickCenter(g.center) })),
      total,
      page,
      pageSize,
    };
  }

  @Post("api/admin/gallery")
  @UseGuards(AdminGuard)
  async create(@Body() dto: GalleryDto) {
    const sortOrder = dto.sortOrder ?? (await nextSortOrder(this.gallery));
    const centerId = await this.resolveCenterId(dto.album, dto.centerId);
    const saved = await this.gallery.save(
      this.gallery.create({
        imageKey: dto.imageKey,
        alt: dto.alt,
        album: dto.album,
        centerId,
        published: dto.published ?? true,
        sortOrder,
      }),
    );
    const row = await this.gallery.findOneOrFail({
      where: { id: saved.id },
      relations: { center: true },
    });
    await this.bust();
    return { ...row, center: this.pickCenter(row.center) };
  }

  @Put("api/admin/gallery/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: GalleryDto) {
    const centerId = await this.resolveCenterId(dto.album, dto.centerId);
    const current = await this.gallery.findOneByOrFail({ id });
    Object.assign(current, {
      imageKey: dto.imageKey,
      alt: dto.alt,
      album: dto.album,
      centerId,
      published: dto.published,
      sortOrder: dto.sortOrder,
    });
    await this.gallery.save(current);
    const row = await this.gallery.findOneOrFail({
      where: { id },
      relations: { center: true },
    });
    await this.bust();
    return { ...row, center: this.pickCenter(row.center) };
  }

  @Post("api/admin/gallery/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.gallery.manager.transaction(async (em) => {
      const repo = em.getRepository(GalleryImage);
      for (const [index, id] of dto.ids.entries()) {
        await repo.update({ id }, { sortOrder: index + 1 });
      }
    });
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/gallery/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.gallery.findOneByOrFail({ id });
    await this.gallery.delete({ id });
    await this.bust();
    return { success: true };
  }
}
