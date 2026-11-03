import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "@corujinha/database";
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from "class-validator";
import { Transform } from "class-transformer";
import { Repository } from "typeorm";
import { AuthGuard, CurrentUser, SessionUser } from "./auth.guard";

class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  image?: string;
}

@Controller("api")
export class AuthController {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  @Get("me")
  @UseGuards(AuthGuard)
  async me(@CurrentUser() user: SessionUser) {
    const full = await this.users.findOne({
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
    const full = await this.users.findOneByOrFail({ id: user.id });
    full.name = dto.name;
    if (dto.image !== undefined) full.image = dto.image;
    await this.users.save(full);
    return {
      user: {
        id: full.id,
        email: full.email,
        name: full.name,
        role: full.role,
        mustChangePassword: full.mustChangePassword,
        image: full.image,
      },
    };
  }
}
