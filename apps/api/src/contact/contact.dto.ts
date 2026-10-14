import {
  Equals,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export enum ContactKindDto {
  GENERAL = "GENERAL",
  ENROLLMENT = "ENROLLMENT",
}

export class ContactDto {
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

  /** Honeypot — bots preenchem; humanos não. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @IsBoolean()
  @Equals(true, { message: "É necessário aceitar a política de privacidade." })
  privacyConsent!: boolean;
}

export class UpdateContactDto {
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNotes?: string;
}
