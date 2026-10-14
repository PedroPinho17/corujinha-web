import { IsIn, IsOptional, IsString } from "class-validator";

const ALL_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
const FOLDERS = ["uploads", "gallery", "posts", "teams", "protocols", "branding"] as const;

export class PresignDto {
  @IsString()
  @IsIn([...ALL_TYPES], {
    message:
      "contentType inválido — use image/jpeg, image/png, image/webp ou application/pdf (protocols).",
  })
  contentType!: string;

  @IsOptional()
  @IsString()
  @IsIn([...FOLDERS], {
    message: "folder inválido",
  })
  folder?: string;
}

export { ALL_TYPES, FOLDERS };
