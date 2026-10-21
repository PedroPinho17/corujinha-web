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
    await expect(svc.createPresignedUpload("text/html", "uploads", 100)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects invalid folders", async () => {
    const { MediaService } = await import("./media.service");
    const svc = new MediaService();
    await expect(svc.createPresignedUpload("image/jpeg", "../etc", 100)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects oversized images", async () => {
    const { MediaService, MAX_IMAGE_BYTES } = await import("./media.service");
    const svc = new MediaService();
    await expect(
      svc.createPresignedUpload("image/png", "gallery", MAX_IMAGE_BYTES + 1),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("allows pdf only in protocols", async () => {
    const { MediaService } = await import("./media.service");
    const svc = new MediaService();
    await expect(
      svc.createPresignedUpload("application/pdf", "posts", 1000),
    ).rejects.toBeInstanceOf(BadRequestException);
    const ok = await svc.createPresignedUpload("application/pdf", "protocols", 1000);
    expect(ok.key.startsWith("protocols/")).toBe(true);
    expect(ok.key.endsWith(".pdf")).toBe(true);
  });

  it("returns signed upload for images", async () => {
    const { MediaService } = await import("./media.service");
    const svc = new MediaService();
    const ok = await svc.createPresignedUpload("image/png", "gallery", 2048);
    expect(ok.uploadUrl).toContain("http");
    expect(ok.key.startsWith("gallery/")).toBe(true);
    expect(ok.size).toBe(2048);
  });

  it("getPublicUrl respects include-bucket flag and pingBucket", async () => {
    process.env.S3_PUBLIC_INCLUDE_BUCKET = "true";
    const { MediaService } = await import("./media.service");
    const svc = new MediaService();
    expect(svc.getPublicUrl("gallery/a.png")).toContain("/corujinha-media/gallery/a.png");
    const send = vi.spyOn((svc as unknown as { client: { send: typeof vi.fn } }).client, "send");
    send.mockResolvedValueOnce({});
    expect(await svc.pingBucket()).toBe(true);
    send.mockRejectedValueOnce(new Error("down"));
    expect(await svc.pingBucket()).toBe(false);
  });

  it("onModuleInit ensures bucket and CORS when origins exist", async () => {
    process.env.S3_CORS_ORIGINS = "http://localhost:3000";
    const { MediaService } = await import("./media.service");
    const svc = new MediaService();
    const send = vi.spyOn((svc as unknown as { client: { send: typeof vi.fn } }).client, "send");
    send.mockRejectedValueOnce(new Error("missing")).mockResolvedValue({});
    await svc.onModuleInit();
    expect(send.mock.calls.length).toBeGreaterThan(1);
  });
});
