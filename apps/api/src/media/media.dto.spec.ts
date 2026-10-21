import { describe, expect, it } from "vitest";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PresignDto } from "./media.dto";

describe("PresignDto", () => {
  it("accepts allowed image types and folders", async () => {
    const dto = plainToInstance(PresignDto, {
      contentType: "image/webp",
      folder: "posts",
      size: 1024,
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it("rejects missing or oversized size", async () => {
    const missing = plainToInstance(PresignDto, {
      contentType: "image/png",
      folder: "gallery",
    });
    expect((await validate(missing)).length).toBeGreaterThan(0);

    const huge = plainToInstance(PresignDto, {
      contentType: "image/png",
      folder: "gallery",
      size: 50_000_000,
    });
    expect((await validate(huge)).length).toBeGreaterThan(0);
  });

  it("rejects invalid contentType and folder", async () => {
    const dto = plainToInstance(PresignDto, {
      contentType: "text/html",
      folder: "../etc",
      size: 100,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
