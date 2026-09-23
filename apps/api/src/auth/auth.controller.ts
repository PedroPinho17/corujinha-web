import { Controller, Get, Post, Put, Body, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUser, SessionUser } from "./auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { IsOptional, IsString, MinLength } from "class-validator";
import { hashPassword } from "better-auth/crypto";

class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  password!: string;
}

class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  image?: string;
}

@Controller("api")
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: SessionUser) {
    const full = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
        image: true,
      },
    });
    return { user: full };
  }

  @Put("me")
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser() user: SessionUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const full = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: dto.name,
        image: dto.image,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
        image: true,
      },
    });
    return { user: full };
  }

  @Post("me/change-password")
  @UseGuards(AuthGuard)
  async changePassword(
    @CurrentUser() user: SessionUser,
    @Body() dto: ChangePasswordDto,
  ) {
    const passwordHash = await hashPassword(dto.password);
    const account = await this.prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (account) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: { password: passwordHash },
      });
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { mustChangePassword: false },
    });
    return { success: true };
  }
}
