import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { IsArray, IsOptional, IsString, ArrayMinSize } from "class-validator";
import { AdminGuard } from "../auth/auth.guard";
import { TranslateService } from "./translate.service";

class TranslateDto {
  @IsString()
  text!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  targets!: string[];

  @IsOptional()
  @IsString()
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
