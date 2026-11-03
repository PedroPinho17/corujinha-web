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
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength } from "class-validator";
import { SchoolProtocol } from "@corujinha/database";
import { Repository } from "typeorm";
import { AdminGuard } from "../auth/auth.guard";
import { nextSortOrder } from "../common/sort-order";
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
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];
}

@Controller()
export class ProtocolsController {
  constructor(
    @InjectRepository(SchoolProtocol) private readonly protocols: Repository<SchoolProtocol>,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:home", "public:protocols");
  }

  @Get("api/public/protocols")
  async publicList() {
    const cached = await this.redis.getJson("public:protocols");
    if (cached) return cached;
    const data = await this.protocols.find({
      where: { active: true },
      order: { sortOrder: "ASC" },
      select: {
        id: true,
        schoolName: true,
        link: true,
        description: true,
        documentKey: true,
      },
    });
    await this.redis.setJson("public:protocols", data);
    return data;
  }

  @Get("api/admin/protocols")
  @UseGuards(AdminGuard)
  adminList() {
    return this.protocols.find({ order: { sortOrder: "ASC" } });
  }

  @Post("api/admin/protocols")
  @UseGuards(AdminGuard)
  async create(@Body() dto: ProtocolDto) {
    const sortOrder = dto.sortOrder ?? (await nextSortOrder(this.protocols));
    const row = await this.protocols.save(
      this.protocols.create({
        schoolName: dto.schoolName,
        link: dto.link,
        description: dto.description,
        documentKey: dto.documentKey,
        active: dto.active ?? true,
        sortOrder,
      }),
    );
    await this.bust();
    return row;
  }

  @Put("api/admin/protocols/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: ProtocolDto) {
    const current = await this.protocols.findOneByOrFail({ id });
    Object.assign(current, {
      schoolName: dto.schoolName,
      link: dto.link,
      description: dto.description,
      documentKey: dto.documentKey,
      active: dto.active,
      sortOrder: dto.sortOrder,
    });
    const row = await this.protocols.save(current);
    await this.bust();
    return row;
  }

  @Patch("api/admin/protocols/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.protocols.findOneByOrFail({ id });
    current.active = !current.active;
    const row = await this.protocols.save(current);
    await this.bust();
    return row;
  }

  @Post("api/admin/protocols/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.protocols.manager.transaction(async (em) => {
      const repo = em.getRepository(SchoolProtocol);
      for (const [index, id] of dto.ids.entries()) {
        await repo.update({ id }, { sortOrder: index + 1 });
      }
    });
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/protocols/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.protocols.findOneByOrFail({ id });
    await this.protocols.delete({ id });
    await this.bust();
    return { success: true };
  }
}
