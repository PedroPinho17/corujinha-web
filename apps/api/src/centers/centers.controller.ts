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
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";
import { AdminGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

class CenterDto {
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug deve ser kebab-case (ex.: sao-joao-de-ver)",
  })
  slug!: string;

  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  shortName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

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
export class CentersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:centers", "public:gallery", "public:home");
  }

  @Get("api/public/centers")
  async publicList() {
    const cached = await this.redis.getJson("public:centers");
    if (cached) return cached;
    const data = await this.prisma.center.findMany({
      where: { published: true },
      orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    });
    await this.redis.setJson("public:centers", data);
    return data;
  }

  @Get("api/admin/centers")
  @UseGuards(AdminGuard)
  adminList() {
    return this.prisma.center.findMany({
      orderBy: [{ sortOrder: "asc" }],
    });
  }

  @Post("api/admin/centers")
  @UseGuards(AdminGuard)
  async create(@Body() dto: CenterDto) {
    const max = await this.prisma.center.aggregate({ _max: { sortOrder: true } });
    if (dto.isPrimary) {
      await this.prisma.center.updateMany({ data: { isPrimary: false } });
    }
    const row = await this.prisma.center.create({
      data: {
        slug: dto.slug,
        name: dto.name,
        shortName: dto.shortName,
        address: dto.address,
        city: dto.city,
        postalCode: dto.postalCode,
        phone: dto.phone,
        email: dto.email,
        isPrimary: dto.isPrimary ?? false,
        published: dto.published ?? true,
        sortOrder: dto.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      },
    });
    await this.bust();
    return row;
  }

  @Put("api/admin/centers/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: CenterDto) {
    if (dto.isPrimary) {
      await this.prisma.center.updateMany({
        where: { id: { not: id } },
        data: { isPrimary: false },
      });
    }
    const row = await this.prisma.center.update({
      where: { id },
      data: {
        slug: dto.slug,
        name: dto.name,
        shortName: dto.shortName,
        address: dto.address,
        city: dto.city,
        postalCode: dto.postalCode,
        phone: dto.phone,
        email: dto.email,
        isPrimary: dto.isPrimary,
        published: dto.published,
        sortOrder: dto.sortOrder,
      },
    });
    await this.bust();
    return row;
  }

  @Patch("api/admin/centers/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.prisma.center.findUniqueOrThrow({ where: { id } });
    const row = await this.prisma.center.update({
      where: { id },
      data: { published: !current.published },
    });
    await this.bust();
    return row;
  }

  @Post("api/admin/centers/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.center.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/centers/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.prisma.center.delete({ where: { id } });
    await this.bust();
    return { success: true };
  }
}
