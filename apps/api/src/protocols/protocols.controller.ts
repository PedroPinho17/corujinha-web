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

class ProtocolDto {
  @IsString()
  @MaxLength(255)
  schoolName!: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  documentKey?: string;

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
export class ProtocolsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:home", "public:protocols");
  }

  @Get("api/public/protocols")
  async publicList() {
    const cached = await this.redis.getJson("public:protocols");
    if (cached) return cached;
    const data = await this.prisma.schoolProtocol.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    await this.redis.setJson("public:protocols", data);
    return data;
  }

  @Get("api/admin/protocols")
  @UseGuards(AdminGuard)
  adminList() {
    return this.prisma.schoolProtocol.findMany({ orderBy: { sortOrder: "asc" } });
  }

  @Post("api/admin/protocols")
  @UseGuards(AdminGuard)
  async create(@Body() dto: ProtocolDto) {
    const max = await this.prisma.schoolProtocol.aggregate({ _max: { sortOrder: true } });
    const row = await this.prisma.schoolProtocol.create({
      data: {
        schoolName: dto.schoolName,
        link: dto.link,
        description: dto.description,
        documentKey: dto.documentKey,
        active: dto.active ?? true,
        sortOrder: dto.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
      },
    });
    await this.bust();
    return row;
  }

  @Put("api/admin/protocols/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: ProtocolDto) {
    const row = await this.prisma.schoolProtocol.update({
      where: { id },
      data: {
        schoolName: dto.schoolName,
        link: dto.link,
        description: dto.description,
        documentKey: dto.documentKey,
        active: dto.active,
        sortOrder: dto.sortOrder,
      },
    });
    await this.bust();
    return row;
  }

  @Patch("api/admin/protocols/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.prisma.schoolProtocol.findUniqueOrThrow({ where: { id } });
    const row = await this.prisma.schoolProtocol.update({
      where: { id },
      data: { active: !current.active },
    });
    await this.bust();
    return row;
  }

  @Post("api/admin/protocols/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.schoolProtocol.update({ where: { id }, data: { sortOrder: index + 1 } }),
      ),
    );
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/protocols/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.prisma.schoolProtocol.delete({ where: { id } });
    await this.bust();
    return { success: true };
  }
}
