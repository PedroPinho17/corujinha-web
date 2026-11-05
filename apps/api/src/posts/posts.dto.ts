import { Transform } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";

export class PostDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  content?: string;

  @IsOptional()
  // null (not undefined) so that clearing the field is persisted: save() skips undefined.
  @Transform(({ value }) => (value === "" ? null : value))
  @IsUrl({ protocols: ["https"], require_protocol: true })
  @MaxLength(2048)
  link?: string | null;

  @IsOptional()
  @IsString()
  phone?: string;

  /** Empty string from the admin form clears the field and must not fail @IsEmail. */
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  @IsEmail({}, { message: "Email inválido" })
  email?: string | null;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsString()
  imageKey?: string;

  @IsOptional()
  translations?: unknown;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class ReorderDto {
  @IsArray()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  ids!: string[];
}
