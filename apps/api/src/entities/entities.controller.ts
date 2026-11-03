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
import { Entity, Formation } from "@corujinha/database";
import { Repository } from "typeorm";
import { AdminGuard } from "../auth/auth.guard";
import { nextSortOrder } from "../common/sort-order";
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
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];
}

@Controller()
export class EntitiesController {
  constructor(
    @InjectRepository(Entity) private readonly entities: Repository<Entity>,
    @InjectRepository(Formation) private readonly formations: Repository<Formation>,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:home", "public:entities", "public:formations");
  }

  @Get("api/public/entities")
  async publicList() {
    const cached = await this.redis.getJson("public:entities");
    if (cached) return cached;
    const rows = await this.entities
      .createQueryBuilder("e")
      .leftJoinAndSelect("e.formations", "f", "f.active = :active", { active: true })
      .where("e.published = :published", { published: true })
      .orderBy("e.sortOrder", "ASC")
      .addOrderBy("f.sortOrder", "ASC")
      .getMany();

    const data = rows.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      location: e.location,
      website: e.website,
      formations: (e.formations ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        duration: f.duration,
        location: f.location,
      })),
    }));
    await this.redis.setJson("public:entities", data);
    return data;
  }

  @Get("api/admin/entities")
  @UseGuards(AdminGuard)
  async adminList() {
    const rows = await this.entities.find({
      order: { sortOrder: "ASC" },
    });
    const counts = await Promise.all(
      rows.map((e) => this.formations.count({ where: { entityId: e.id } })),
    );
    return rows.map((e, i) => ({
      ...e,
      _count: { formations: counts[i] },
    }));
  }

  @Post("api/admin/entities")
  @UseGuards(AdminGuard)
  async create(@Body() dto: EntityDto) {
    const sortOrder = dto.sortOrder ?? (await nextSortOrder(this.entities));
    const row = await this.entities.save(
      this.entities.create({
        name: dto.name,
        description: dto.description,
        location: dto.location,
        website: dto.website,
        translations: dto.translations as Record<string, unknown> | undefined,
        published: dto.published ?? true,
        sortOrder,
      }),
    );
    await this.bust();
    return row;
  }

  @Put("api/admin/entities/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: EntityDto) {
    const current = await this.entities.findOneByOrFail({ id });
    Object.assign(current, {
      name: dto.name,
      description: dto.description,
      location: dto.location,
      website: dto.website,
      translations: dto.translations as Record<string, unknown> | undefined,
      published: dto.published,
      sortOrder: dto.sortOrder,
    });
    const row = await this.entities.save(current);
    await this.bust();
    return row;
  }

  @Patch("api/admin/entities/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.entities.findOneByOrFail({ id });
    current.published = !current.published;
    const row = await this.entities.save(current);
    await this.bust();
    return row;
  }

  @Post("api/admin/entities/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.entities.manager.transaction(async (em) => {
      const repo = em.getRepository(Entity);
      for (const [index, id] of dto.ids.entries()) {
        await repo.update({ id }, { sortOrder: index + 1 });
      }
    });
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/entities/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.entities.findOneByOrFail({ id });
    await this.entities.delete({ id });
    await this.bust();
    return { success: true };
  }
}
