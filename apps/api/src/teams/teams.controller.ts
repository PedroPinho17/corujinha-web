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
  MaxLength,
} from "class-validator";
import { AdminGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

class TeamDto {
  @IsString()
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

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
export class TeamsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:home", "public:team");
  }

  @Get("api/public/team")
  async publicList() {
    const cached = await this.redis.getJson("public:team");
    if (cached) return cached;
    const data = await this.prisma.teamMember.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });
    await this.redis.setJson("public:team", data);
    return data;
  }

  @Get("api/admin/teams")
  @UseGuards(AdminGuard)
  adminList() {
    return this.prisma.teamMember.findMany({ orderBy: { sortOrder: "asc" } });
  }

  @Post("api/admin/teams")
  @UseGuards(AdminGuard)
  async create(@Body() dto: TeamDto) {
    const max = await this.prisma.teamMember.aggregate({ _max: { sortOrder: true } });
    const row = await this.prisma.teamMember.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageKey: dto.imageKey,
        translations: dto.translations as object | undefined,
        published: dto.published ?? true,
        sortOrder: dto.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      },
    });
    await this.bust();
    return row;
  }

  @Put("api/admin/teams/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: TeamDto) {
    const row = await this.prisma.teamMember.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        imageKey: dto.imageKey,
        translations: dto.translations as object | undefined,
        published: dto.published,
        sortOrder: dto.sortOrder,
      },
    });
    await this.bust();
    return row;
  }

  @Patch("api/admin/teams/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.prisma.teamMember.findUniqueOrThrow({ where: { id } });
    const row = await this.prisma.teamMember.update({
      where: { id },
      data: { published: !current.published },
    });
    await this.bust();
    return row;
  }

  @Post("api/admin/teams/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.teamMember.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/teams/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.prisma.teamMember.delete({ where: { id } });
    await this.bust();
    return { success: true };
  }
}
