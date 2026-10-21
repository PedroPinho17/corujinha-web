import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AdminGuard } from "../auth/auth.guard";
import { clientIp } from "../common/rate-limit";
import { ContactService } from "./contact.service";
import { ContactDto, UpdateContactDto } from "./contact.dto";

@Controller("api")
export class ContactController {
  constructor(private readonly contacts: ContactService) {}

  @Post("public/contact")
  submit(@Body() dto: ContactDto, @Req() req: Parameters<typeof clientIp>[0]) {
    return this.contacts.submit(dto, clientIp(req));
  }

  @Get("admin/contacts")
  @UseGuards(AdminGuard)
  list(@Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.contacts.list(Number(page) || 1, Number(pageSize) || 50);
  }

  @Patch("admin/contacts/:id")
  @UseGuards(AdminGuard)
  update(@Param("id") id: string, @Body() dto: UpdateContactDto) {
    return this.contacts.update(id, dto);
  }

  @Get("admin/contacts/:id/gdpr-export")
  @UseGuards(AdminGuard)
  async gdprExport(@Param("id") id: string, @Res({ passthrough: true }) res: Response) {
    const payload = await this.contacts.exportGdpr(id);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="gdpr-export-contact-${id}.json"`,
    );
    return payload;
  }

  @Post("admin/contacts/:id/gdpr-erase")
  @UseGuards(AdminGuard)
  erase(@Param("id") id: string, @Body() body: { confirm?: boolean }) {
    if (body?.confirm !== true) {
      throw new BadRequestException("confirm: true é obrigatório");
    }
    return this.contacts.eraseGdpr(id);
  }
}
