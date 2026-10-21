import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/auth.guard";
import { MediaService } from "./media.service";
import { PresignDto } from "./media.dto";

@Controller("api/admin/media")
@UseGuards(AdminGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post("presign")
  presign(@Body() dto: PresignDto) {
    return this.media.createPresignedUpload(
      dto.contentType,
      dto.folder || "uploads",
      dto.size,
    );
  }
}
