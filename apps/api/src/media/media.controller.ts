import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { IsString } from "class-validator";
import { AdminGuard } from "../auth/auth.guard";
import { MediaService } from "./media.service";

class PresignDto {
  @IsString()
  contentType!: string;

  @IsString()
  folder!: string;
}

@Controller("api/admin/media")
@UseGuards(AdminGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post("presign")
  presign(@Body() dto: PresignDto) {
    return this.media.createPresignedUpload(dto.contentType, dto.folder || "uploads");
  }
}
