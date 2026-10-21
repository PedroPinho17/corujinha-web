import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { AdminGuard } from "../auth/auth.guard";
import { TranslateService } from "./translate.service";

class TranslateDto {
  @IsString()
  @MaxLength(5000)
  text!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  targets!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(10)
  source_code?: string;
}

@Controller("api/admin/translate")
@UseGuards(AdminGuard)
export class TranslateController {
  constructor(private readonly translate: TranslateService) {}

  /** Parity with Laravel DeepL helper: POST /admin/traducoes-idiomas/translate */
  @Post()
  async translateText(@Body() dto: TranslateDto) {
    return this.translate.translate(dto.text, dto.targets, dto.source_code);
  }
}
