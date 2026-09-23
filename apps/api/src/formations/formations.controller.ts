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

class FormationDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  translations?: unknown;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class ReorderDto {
  @IsArray()
  ids!: string[];
}

@Controller()
export class FormationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:home", "public:formations", "public:entities");
  }

  @Get("api/public/formations")
  async publicList() {
    const cached = await this.redis.getJson("public:formations");
    if (cached) return cached;
    const data = await this.prisma.formation.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { entity: true },
    });
    await this.redis.setJson("public:formations", data);
    return data;
  }

  @Get("api/admin/formations")
  @UseGuards(AdminGuard)
  adminList() {
    return this.prisma.formation.findMany({
      orderBy: { sortOrder: "asc" },
      include: { entity: true },
    });
  }

  @Post("api/admin/formations")
  @UseGuards(AdminGuard)
  async create(@Body() dto: FormationDto) {
    const max = await this.prisma.formation.aggregate({ _max: { sortOrder: true } });
    const row = await this.prisma.formation.create({
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        location: dto.location,
        entityId: dto.entityId || null,
        translations: dto.translations as object | undefined,
        active: dto.active ?? true,
        sortOrder: dto.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      },
    });
    await this.bust();
    return row;
  }

  @Put("api/admin/formations/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: FormationDto) {
    const row = await this.prisma.formation.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        location: dto.location,
        entityId: dto.entityId || null,
        translations: dto.translations as object | undefined,
        active: dto.active,
        sortOrder: dto.sortOrder,
      },
    });
    await this.bust();
    return row;
  }

  @Patch("api/admin/formations/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.prisma.formation.findUniqueOrThrow({ where: { id } });
    const row = await this.prisma.formation.update({
      where: { id },
      data: { active: !current.active },
    });
    await this.bust();
    return row;
  }

  @Post("api/admin/formations/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.formation.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/formations/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.prisma.formation.delete({ where: { id } });
    await this.bust();
    return { success: true };
  }
}
