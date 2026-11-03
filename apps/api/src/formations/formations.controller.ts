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
import { Formation } from "@corujinha/database";
import { Repository } from "typeorm";
import { AdminGuard } from "../auth/auth.guard";
import { nextSortOrder } from "../common/sort-order";
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
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];
}

@Controller()
export class FormationsController {
  constructor(
    @InjectRepository(Formation) private readonly formations: Repository<Formation>,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:home", "public:formations", "public:entities");
  }

  @Get("api/public/formations")
  async publicList() {
    const cached = await this.redis.getJson("public:formations");
    if (cached) return cached;
    const rows = await this.formations.find({
      where: { active: true },
      order: { sortOrder: "ASC" },
      relations: { entity: true },
    });
    const data = rows.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      duration: f.duration,
      location: f.location,
      entityId: f.entityId,
      entity: f.entity
        ? { id: f.entity.id, name: f.entity.name, website: f.entity.website }
        : null,
    }));
    await this.redis.setJson("public:formations", data);
    return data;
  }

  @Get("api/admin/formations")
  @UseGuards(AdminGuard)
  adminList() {
    return this.formations.find({
      order: { sortOrder: "ASC" },
      relations: { entity: true },
    });
  }

  @Post("api/admin/formations")
  @UseGuards(AdminGuard)
  async create(@Body() dto: FormationDto) {
    const sortOrder = dto.sortOrder ?? (await nextSortOrder(this.formations));
    const row = await this.formations.save(
      this.formations.create({
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        location: dto.location,
        entityId: dto.entityId || null,
        translations: dto.translations as Record<string, unknown> | undefined,
        active: dto.active ?? true,
        sortOrder,
      }),
    );
    await this.bust();
    return row;
  }

  @Put("api/admin/formations/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: FormationDto) {
    const current = await this.formations.findOneByOrFail({ id });
    Object.assign(current, {
      name: dto.name,
      description: dto.description,
      duration: dto.duration,
      location: dto.location,
      entityId: dto.entityId || null,
      translations: dto.translations as Record<string, unknown> | undefined,
      active: dto.active,
      sortOrder: dto.sortOrder,
    });
    const row = await this.formations.save(current);
    await this.bust();
    return row;
  }

  @Patch("api/admin/formations/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.formations.findOneByOrFail({ id });
    current.active = !current.active;
    const row = await this.formations.save(current);
    await this.bust();
    return row;
  }

  @Post("api/admin/formations/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.formations.manager.transaction(async (em) => {
      const repo = em.getRepository(Formation);
      for (const [index, id] of dto.ids.entries()) {
        await repo.update({ id }, { sortOrder: index + 1 });
      }
    });
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/formations/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.formations.findOneByOrFail({ id });
    await this.formations.delete({ id });
    await this.bust();
    return { success: true };
  }
}
