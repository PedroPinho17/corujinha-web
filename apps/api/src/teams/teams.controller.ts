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
import { TeamMember } from "@corujinha/database";
import { Repository } from "typeorm";
import { AdminGuard } from "../auth/auth.guard";
import { nextSortOrder } from "../common/sort-order";
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
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];
}

@Controller()
export class TeamsController {
  constructor(
    @InjectRepository(TeamMember) private readonly teamMembers: Repository<TeamMember>,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:home", "public:team");
  }

  @Get("api/public/team")
  async publicList() {
    const cached = await this.redis.getJson("public:team");
    if (cached) return cached;
    const data = await this.teamMembers.find({
      where: { published: true },
      order: { sortOrder: "ASC" },
      select: {
        id: true,
        name: true,
        description: true,
        imageKey: true,
      },
    });
    await this.redis.setJson("public:team", data);
    return data;
  }

  @Get("api/admin/teams")
  @UseGuards(AdminGuard)
  adminList() {
    return this.teamMembers.find({ order: { sortOrder: "ASC" } });
  }

  @Post("api/admin/teams")
  @UseGuards(AdminGuard)
  async create(@Body() dto: TeamDto) {
    const sortOrder = dto.sortOrder ?? (await nextSortOrder(this.teamMembers));
    const row = await this.teamMembers.save(
      this.teamMembers.create({
        name: dto.name,
        description: dto.description,
        imageKey: dto.imageKey,
        translations: dto.translations as Record<string, unknown> | undefined,
        published: dto.published ?? true,
        sortOrder,
      }),
    );
    await this.bust();
    return row;
  }

  @Put("api/admin/teams/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: TeamDto) {
    const current = await this.teamMembers.findOneByOrFail({ id });
    Object.assign(current, {
      name: dto.name,
      description: dto.description,
      imageKey: dto.imageKey,
      translations: dto.translations as Record<string, unknown> | undefined,
      published: dto.published,
      sortOrder: dto.sortOrder,
    });
    const row = await this.teamMembers.save(current);
    await this.bust();
    return row;
  }

  @Patch("api/admin/teams/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.teamMembers.findOneByOrFail({ id });
    current.published = !current.published;
    const row = await this.teamMembers.save(current);
    await this.bust();
    return row;
  }

  @Post("api/admin/teams/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.teamMembers.manager.transaction(async (em) => {
      const repo = em.getRepository(TeamMember);
      for (const [index, id] of dto.ids.entries()) {
        await repo.update({ id }, { sortOrder: index + 1 });
      }
    });
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/teams/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.teamMembers.findOneByOrFail({ id });
    await this.teamMembers.delete({ id });
    await this.bust();
    return { success: true };
  }
}
