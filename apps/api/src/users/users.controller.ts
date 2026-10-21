import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { UserRole } from "@corujinha/database";
import { hashPassword } from "better-auth/crypto";
import { SuperAdminGuard, CurrentUser, SessionUser } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";

class CreateUserDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

class UpdateUserDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(128)
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

  private async adminCount() {
    return this.prisma.user.count({ where: { role: UserRole.ADMIN } });
  }

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
  async create(@Body() dto: CreateUserDto) {
    const passwordHash = await hashPassword(dto.password);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role ?? UserRole.EDITOR,
        // Always force change on first login — never ship a known default password.
        mustChangePassword: true,
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
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() me: SessionUser,
  ) {
    const existing = await this.prisma.user.findUniqueOrThrow({ where: { id } });

    if (me.id === id && dto.role && dto.role !== UserRole.ADMIN && existing.role === UserRole.ADMIN) {
      throw new ForbiddenException("Não pode remover as suas próprias permissões de administrador.");
    }

    if (
      existing.role === UserRole.ADMIN &&
      dto.role &&
      dto.role !== UserRole.ADMIN &&
      (await this.adminCount()) <= 1
    ) {
      throw new BadRequestException("Tem de existir pelo menos um administrador.");
    }

    const roleChanging = dto.role !== undefined && dto.role !== existing.role;
    const emailChanging =
      dto.email.trim().toLowerCase() !== existing.email.trim().toLowerCase();

    const data: {
      name: string;
      email: string;
      role?: UserRole;
      mustChangePassword?: boolean;
      emailVerified?: boolean;
    } = {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      mustChangePassword: dto.mustChangePassword,
    };
    if (emailChanging) {
      // Require re-verification after admin changes email.
      data.emailVerified = false;
    }
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
    if (dto.password || roleChanging || emailChanging) {
      await this.prisma.session.deleteMany({ where: { userId: id } });
    }
    return user;
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() me: SessionUser) {
    if (me.id === id) {
      throw new ForbiddenException("Não pode apagar a própria conta.");
    }
    const target = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    if (target.role === UserRole.ADMIN && (await this.adminCount()) <= 1) {
      throw new BadRequestException("Não pode apagar o último administrador.");
    }
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
