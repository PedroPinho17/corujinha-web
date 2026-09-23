import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { UserRole } from "@corujinha/database";
import { hashPassword } from "better-auth/crypto";
import { SuperAdminGuard, CurrentUser, SessionUser } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

class UserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}

@Controller("api/admin/users")
@UseGuards(SuperAdminGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Post()
  async create(@Body() dto: UserDto) {
    const password = dto.password ?? "ChangeMe123!";
    const passwordHash = await hashPassword(password);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role ?? UserRole.EDITOR,
        mustChangePassword: dto.mustChangePassword ?? true,
        emailVerified: true,
        accounts: {
          create: {
            accountId: dto.email,
            providerId: "credential",
            password: passwordHash,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
      },
    });
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UserDto) {
    const data: {
      name: string;
      email: string;
      role?: UserRole;
      mustChangePassword?: boolean;
    } = {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      mustChangePassword: dto.mustChangePassword,
    };
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
      },
    });
    if (dto.password) {
      const passwordHash = await hashPassword(dto.password);
      const account = await this.prisma.account.findFirst({
        where: { userId: id, providerId: "credential" },
      });
      if (account) {
        await this.prisma.account.update({
          where: { id: account.id },
          data: { password: passwordHash },
        });
      }
    }
    return user;
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() me: SessionUser) {
    if (me.id === id) {
      return { success: false, message: "Não pode apagar a própria conta" };
    }
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
