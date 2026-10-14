import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { IsString, MinLength } from "class-validator";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { auth } from "./auth";
import { AuthGuard, CurrentUser, type SessionUser } from "./auth.guard";
import { PrismaService } from "../prisma/prisma.service";

class ChangePasswordDto {
  @IsString()
  @MinLength(12)
  currentPassword!: string;

  @IsString()
  @MinLength(12)
  newPassword!: string;
}

const COMMON_WEAK_PASSWORDS = new Set([
  "password123!",
  "password123456",
  "123456789012",
  "qwertyuiopas",
  "adminadmin12",
  "admin123!",
]);

function assertPasswordChangeAllowed(currentPassword: string, newPassword: string): void {
  if (newPassword === currentPassword) {
    throw new BadRequestException(
      "A nova password não pode ser igual à password actual.",
    );
  }
  if (COMMON_WEAK_PASSWORDS.has(newPassword.toLowerCase())) {
    throw new BadRequestException("Escolha uma password mais forte.");
  }
}

@Controller("api/admin/me")
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  /** Change password even when mustChangePassword blocks AdminGuard. */
  @Post("change-password")
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() user: SessionUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    assertPasswordChangeAllowed(dto.currentPassword, dto.newPassword);

    await auth.api.changePassword({
      body: {
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
        revokeOtherSessions: true,
      },
      headers: fromNodeHeaders(req.headers),
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { mustChangePassword: false },
    });

    return { ok: true };
  }
}
