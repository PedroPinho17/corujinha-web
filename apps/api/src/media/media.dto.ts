import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const ALL_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
const FOLDERS = ["uploads", "gallery", "posts", "teams", "protocols", "branding"] as const;

/** Hard cap for any upload (images + PDFs). Matched in MediaService. */
export const MAX_UPLOAD_BYTES = 10_000_000;

export class PresignDto {
  @IsString()
  @IsIn([...ALL_TYPES], {
    message:
      "contentType inválido — use image/jpeg, image/png, image/webp ou application/pdf (protocols).",
  })
  contentType!: string;

  /** Exact byte size of the object that will be PUT — signed into the URL. */
  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_BYTES)
  size!: number;

  @IsOptional()
  @IsString()
  @IsIn([...FOLDERS], {
    message: "folder inválido",
  })
  folder?: string;
}

export { ALL_TYPES, FOLDERS };
