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
import { InjectRepository } from "@nestjs/typeorm";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { Account, Session, User, UserRole } from "@corujinha/database";
import { hashPassword } from "better-auth/crypto";
import { Repository } from "typeorm";
import { SuperAdminGuard, CurrentUser, SessionUser } from "../auth/auth.guard";

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
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Account) private readonly accounts: Repository<Account>,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
  ) {}

  private async adminCount() {
    return this.users.count({ where: { role: UserRole.ADMIN } });
  }

  @Get()
  list() {
    return this.users.find({
      order: { createdAt: "DESC" },
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
    return this.users.manager.transaction(async (em) => {
      const userRepo = em.getRepository(User);
      const accountRepo = em.getRepository(Account);
      const user = await userRepo.save(
        userRepo.create({
          name: dto.name,
          email: dto.email,
          role: dto.role ?? UserRole.EDITOR,
          mustChangePassword: true,
          emailVerified: true,
        }),
      );
      await accountRepo.save(
        accountRepo.create({
          userId: user.id,
          accountId: dto.email,
          providerId: "credential",
          password: passwordHash,
        }),
      );
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      };
    });
  }

  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() me: SessionUser,
  ) {
    const existing = await this.users.findOneByOrFail({ id });

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

    existing.name = dto.name;
    existing.email = dto.email;
    if (dto.role !== undefined) existing.role = dto.role;
    if (dto.mustChangePassword !== undefined) existing.mustChangePassword = dto.mustChangePassword;
    if (emailChanging) {
      existing.emailVerified = false;
    }
    await this.users.save(existing);

    if (dto.password) {
      const passwordHash = await hashPassword(dto.password);
      const account = await this.accounts.findOne({
        where: { userId: id, providerId: "credential" },
      });
      if (account) {
        account.password = passwordHash;
        await this.accounts.save(account);
      }
    }
    if (dto.password || roleChanging || emailChanging) {
      await this.sessions.delete({ userId: id });
    }
    return {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: existing.role,
      mustChangePassword: existing.mustChangePassword,
    };
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() me: SessionUser) {
    if (me.id === id) {
      throw new ForbiddenException("Não pode apagar a própria conta.");
    }
    const target = await this.users.findOneByOrFail({ id });
    if (target.role === UserRole.ADMIN && (await this.adminCount()) <= 1) {
      throw new BadRequestException("Não pode apagar o último administrador.");
    }
    await this.users.delete({ id });
    return { success: true };
  }
}
