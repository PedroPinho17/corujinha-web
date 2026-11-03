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
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength } from "class-validator";
import { Center } from "@corujinha/database";
import { Not, Repository } from "typeorm";
import { AdminGuard } from "../auth/auth.guard";
import { nextSortOrder } from "../common/sort-order";
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
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];
}

@Controller()
export class CentersController {
  constructor(
    @InjectRepository(Center) private readonly centers: Repository<Center>,
    private readonly redis: RedisService,
  ) {}

  private async bust() {
    await this.redis.del("public:centers", "public:gallery", "public:home");
  }

  @Get("api/public/centers")
  async publicList() {
    const cached = await this.redis.getJson("public:centers");
    if (cached) return cached;
    const data = await this.centers.find({
      where: { published: true },
      order: { isPrimary: "DESC", sortOrder: "ASC" },
      select: {
        id: true,
        slug: true,
        name: true,
        shortName: true,
        address: true,
        city: true,
        postalCode: true,
        phone: true,
        email: true,
        isPrimary: true,
      },
    });
    await this.redis.setJson("public:centers", data);
    return data;
  }

  @Get("api/admin/centers")
  @UseGuards(AdminGuard)
  adminList() {
    return this.centers.find({
      order: { sortOrder: "ASC" },
    });
  }

  @Post("api/admin/centers")
  @UseGuards(AdminGuard)
  async create(@Body() dto: CenterDto) {
    const sortOrder = dto.sortOrder ?? (await nextSortOrder(this.centers));
    if (dto.isPrimary) {
      await this.centers.update({}, { isPrimary: false });
    }
    const row = await this.centers.save(
      this.centers.create({
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
        sortOrder,
      }),
    );
    await this.bust();
    return row;
  }

  @Put("api/admin/centers/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: CenterDto) {
    if (dto.isPrimary) {
      await this.centers.update({ id: Not(id) }, { isPrimary: false });
    }
    const current = await this.centers.findOneByOrFail({ id });
    Object.assign(current, {
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
    });
    const row = await this.centers.save(current);
    await this.bust();
    return row;
  }

  @Patch("api/admin/centers/:id/toggle")
  @UseGuards(AdminGuard)
  async toggle(@Param("id") id: string) {
    const current = await this.centers.findOneByOrFail({ id });
    current.published = !current.published;
    const row = await this.centers.save(current);
    await this.bust();
    return row;
  }

  @Post("api/admin/centers/reorder")
  @UseGuards(AdminGuard)
  async reorder(@Body() dto: ReorderDto) {
    await this.centers.manager.transaction(async (em) => {
      const repo = em.getRepository(Center);
      for (const [index, id] of dto.ids.entries()) {
        await repo.update({ id }, { sortOrder: index + 1 });
      }
    });
    await this.bust();
    return { success: true };
  }

  @Delete("api/admin/centers/:id")
  @UseGuards(AdminGuard)
  async remove(@Param("id") id: string) {
    await this.centers.findOneByOrFail({ id });
    await this.centers.delete({ id });
    await this.bust();
    return { success: true };
  }
}
