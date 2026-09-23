import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { AdminGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { CONTACT_QUEUE } from "./contact.processor";

enum ContactKindDto {
  GENERAL = "GENERAL",
  ENROLLMENT = "ENROLLMENT",
}

class ContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsEnum(ContactKindDto)
  kind?: ContactKindDto;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  schoolYear?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;
}

class UpdateContactDto {
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}

@Controller("api")
export class ContactController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CONTACT_QUEUE) private readonly queue: Queue,
  ) {}

  @Post("public/contact")
  async submit(@Body() dto: ContactDto) {
    const kind = dto.kind === ContactKindDto.ENROLLMENT ? "ENROLLMENT" : "GENERAL";
    const row = await this.prisma.contactMessage.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
        kind,
        subject: dto.subject,
        schoolYear: dto.schoolYear,
        location: dto.location,
      },
    });
    await this.queue.add("send", { contactId: row.id });
    return {
      success: true,
      message:
        kind === "ENROLLMENT"
          ? "Pedido de inscrição enviado! Entraremos em contacto em breve."
          : "Mensagem enviada com sucesso!",
    };
  }

  @Get("admin/contacts")
  @UseGuards(AdminGuard)
  list() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  @Patch("admin/contacts/:id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: UpdateContactDto) {
    return this.prisma.contactMessage.update({
      where: { id },
      data: {
        ...(dto.read === true ? { readAt: new Date() } : {}),
        ...(dto.read === false ? { readAt: null } : {}),
        ...(dto.adminNotes !== undefined ? { adminNotes: dto.adminNotes } : {}),
      },
    });
  }
}
