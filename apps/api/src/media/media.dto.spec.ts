import { describe, expect, it } from "vitest";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PresignDto } from "./media.dto";

describe("PresignDto", () => {
  it("accepts allowed image types and folders", async () => {
    const dto = plainToInstance(PresignDto, {
      contentType: "image/webp",
      folder: "posts",
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it("rejects invalid contentType and folder", async () => {
    const dto = plainToInstance(PresignDto, {
      contentType: "text/html",
      folder: "../etc",
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
