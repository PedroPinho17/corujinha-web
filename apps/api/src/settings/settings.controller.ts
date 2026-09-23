import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { IsObject, IsOptional, IsString } from "class-validator";
import { DEFAULT_SITE_CONTENT, mergeSiteContent, type SiteContent } from "@corujinha/shared";
import { AdminGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../redis/redis.service";

class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  brandingName?: string;

  @IsOptional()
  @IsString()
  brandingLogoKey?: string | null;

  @IsOptional()
  @IsString()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  facebookUrl?: string | null;

  @IsOptional()
  @IsString()
  instagramUrl?: string | null;

  @IsOptional()
  @IsObject()
  content?: object;
}

@Controller()
export class SettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private mergeContent(raw: unknown) {
    return mergeSiteContent(raw as Partial<SiteContent> | null);
  }

  private async getOrCreate() {
    let row = await this.prisma.siteSettings.findFirst({ orderBy: { createdAt: "asc" } });
    if (!row) {
      row = await this.prisma.siteSettings.create({
        data: {
          brandingName: "Corujinha",
          contactEmail: "Geral@ninhodacoruja.pt",
          contactPhone: "+351 916 280 509",
          content: DEFAULT_SITE_CONTENT as object,
        },
      });
    } else if (!row.content) {
      row = await this.prisma.siteSettings.update({
        where: { id: row.id },
        data: { content: DEFAULT_SITE_CONTENT as object },
      });
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
    const row = await this.prisma.siteSettings.update({
      where: { id: current.id },
      data: {
        brandingName: dto.brandingName ?? current.brandingName,
        brandingLogoKey: dto.brandingLogoKey === undefined ? current.brandingLogoKey : dto.brandingLogoKey,
        contactEmail: dto.contactEmail === undefined ? current.contactEmail : dto.contactEmail,
        contactPhone: dto.contactPhone === undefined ? current.contactPhone : dto.contactPhone,
        address: dto.address === undefined ? current.address : dto.address,
        facebookUrl: dto.facebookUrl === undefined ? current.facebookUrl : dto.facebookUrl,
        instagramUrl: dto.instagramUrl === undefined ? current.instagramUrl : dto.instagramUrl,
        content: nextContent as object,
      },
    });
    await this.redis.del("public:settings", "public:home");
    return {
      ...row,
      content: this.mergeContent(row.content),
    };
  }
}
