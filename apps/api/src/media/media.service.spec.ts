import { describe, expect, it, vi, beforeEach } from "vitest";
import { BadRequestException } from "@nestjs/common";

vi.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    send = vi.fn();
  }
  class PutObjectCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  return {
    S3Client,
    CreateBucketCommand: class {},
    HeadBucketCommand: class {},
    PutBucketCorsCommand: class {},
    PutBucketWebsiteCommand: class {},
    PutObjectCommand,
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://example.com/upload"),
}));

describe("MediaService.createPresignedUpload", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    process.env.S3_BUCKET = "corujinha-media";
    process.env.S3_PUBLIC_URL = "http://localhost:3902";
    process.env.S3_ACCESS_KEY = "testkey";
    process.env.S3_SECRET_KEY = "testsecret";
    vi.resetModules();
  });

  it("rejects invalid content types", async () => {
    const { MediaService } = await import("./media.service");
    const svc = new MediaService();
    await expect(svc.createPresignedUpload("text/html", "uploads")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects invalid folders", async () => {
    const { MediaService } = await import("./media.service");
    const svc = new MediaService();
    await expect(svc.createPresignedUpload("image/jpeg", "../etc")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("allows pdf only in protocols", async () => {
    const { MediaService } = await import("./media.service");
    const svc = new MediaService();
    await expect(
      svc.createPresignedUpload("application/pdf", "posts"),
    ).rejects.toBeInstanceOf(BadRequestException);
    const ok = await svc.createPresignedUpload("application/pdf", "protocols");
    expect(ok.key.startsWith("protocols/")).toBe(true);
    expect(ok.key.endsWith(".pdf")).toBe(true);
  });

  it("returns signed upload for images", async () => {
    const { MediaService } = await import("./media.service");
    const svc = new MediaService();
    const ok = await svc.createPresignedUpload("image/png", "gallery");
    expect(ok.uploadUrl).toContain("http");
    expect(ok.key.startsWith("gallery/")).toBe(true);
  });
});
