import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Transform } from "class-transformer";
import {
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from "class-validator";
import { SiteSettings } from "@corujinha/database";
import { DEFAULT_SITE_CONTENT, mergeSiteContent, type SiteContent } from "@corujinha/shared";
import { Repository } from "typeorm";
import { AdminGuard } from "../auth/auth.guard";
import { RedisService } from "../redis/redis.service";

class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brandingName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  brandingLogoKey?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(254)
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  @ValidateIf((_, v) => v != null)
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  facebookUrl?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  @ValidateIf((_, v) => v != null)
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  instagramUrl?: string | null;

  @IsOptional()
  @IsObject()
  content?: object;
}

@Controller()
export class SettingsController {
  constructor(
    @InjectRepository(SiteSettings) private readonly settings: Repository<SiteSettings>,
    private readonly redis: RedisService,
  ) {}

  private mergeContent(raw: unknown) {
    return mergeSiteContent(raw as Partial<SiteContent> | null);
  }

  private async getOrCreate() {
    let row =
      (await this.settings.find({ order: { createdAt: "ASC" }, take: 1 }))[0] ?? null;
    if (!row) {
      row = await this.settings.save(
        this.settings.create({
          brandingName: "Corujinha",
          contactEmail: "Geral@ninhodacoruja.pt",
          contactPhone: "+351 916 280 509",
          content: DEFAULT_SITE_CONTENT as unknown as Record<string, unknown>,
        }),
      );
    } else if (!row.content) {
      row.content = DEFAULT_SITE_CONTENT as unknown as Record<string, unknown>;
      row = await this.settings.save(row);
    }
    return row;
  }

  @Get("api/public/settings")
  async publicSettings() {
    const cached = await this.redis.getJson("public:settings");
    if (cached) {
      return {
        ...(cached as object),
        content: this.mergeContent((cached as { content?: unknown }).content),
      };
    }
    const row = await this.getOrCreate();
    const payload = {
      ...row,
      content: this.mergeContent(row.content),
    };
    await this.redis.setJson("public:settings", payload);
    return payload;
  }

  @Get("api/admin/settings")
  @UseGuards(AdminGuard)
  async adminGet() {
    const row = await this.getOrCreate();
    return {
      ...row,
      content: this.mergeContent(row.content),
    };
  }

  @Put("api/admin/settings")
  @UseGuards(AdminGuard)
  async adminUpdate(@Body() dto: UpdateSettingsDto) {
    const current = await this.getOrCreate();
    const nextContent = dto.content
      ? this.mergeContent(dto.content)
      : this.mergeContent(current.content);
    Object.assign(current, {
      brandingName: dto.brandingName ?? current.brandingName,
      brandingLogoKey:
        dto.brandingLogoKey === undefined ? current.brandingLogoKey : dto.brandingLogoKey,
      contactEmail: dto.contactEmail === undefined ? current.contactEmail : dto.contactEmail,
      contactPhone: dto.contactPhone === undefined ? current.contactPhone : dto.contactPhone,
      address: dto.address === undefined ? current.address : dto.address,
      facebookUrl: dto.facebookUrl === undefined ? current.facebookUrl : dto.facebookUrl,
      instagramUrl: dto.instagramUrl === undefined ? current.instagramUrl : dto.instagramUrl,
      content: nextContent as unknown as Record<string, unknown>,
    });
    const row = await this.settings.save(current);
    await this.redis.del("public:settings", "public:home");
    return {
      ...row,
      content: this.mergeContent(row.content),
    };
  }
}
