import { BadRequestException, Injectable, OnModuleInit } from "@nestjs/common";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
  PutBucketWebsiteCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_FOLDERS = new Set([
  "uploads",
  "gallery",
  "posts",
  "teams",
  "protocols",
  "branding",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Example / placeholder credentials that must never ship to real production. */
export const FORBIDDEN_S3_ACCESS_KEYS = new Set([
  "minioadmin",
  "GKabcdef0123456789abcdef01234567",
]);

export const FORBIDDEN_S3_SECRET_KEYS = new Set([
  "minioadmin",
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
]);

function requireS3Creds(): { accessKeyId: string; secretAccessKey: string } {
  const accessKeyId = process.env.S3_ACCESS_KEY?.trim();
  const secretAccessKey = process.env.S3_SECRET_KEY?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (!accessKeyId || !secretAccessKey) {
    if (isProd) {
      throw new Error("S3_ACCESS_KEY e S3_SECRET_KEY são obrigatórios em produção.");
    }
    return { accessKeyId: "minioadmin", secretAccessKey: "minioadmin" };
  }

  if (
    isProd &&
    (FORBIDDEN_S3_ACCESS_KEYS.has(accessKeyId) ||
      FORBIDDEN_S3_SECRET_KEYS.has(secretAccessKey))
  ) {
    throw new Error(
      "Credenciais S3 de exemplo / por omissão não são permitidas em produção.",
    );
  }

  return { accessKeyId, secretAccessKey };
}

function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: requireS3Creds(),
    // AWS SDK v3 default flexible checksums break Garage/R2 presigned PUTs
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

@Injectable()
export class MediaService implements OnModuleInit {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;
  private includeBucketInPublicUrl: boolean;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "corujinha-media";
    this.publicUrl =
      process.env.S3_PUBLIC_URL ?? "http://corujinha-media.web.garage.localhost:3902";
    this.includeBucketInPublicUrl = process.env.S3_PUBLIC_INCLUDE_BUCKET === "true";
    this.client = createS3Client();
  }

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch {
        // bucket may already exist or object storage not up yet in cold starts
      }
    }

    await this.ensureBucketPublicAccess();
  }

  /** CORS for browser PUT/GET; website endpoint for anonymous reads (Garage). */
  private async ensureBucketPublicAccess() {
    const isProd = process.env.NODE_ENV === "production";
    const origins = (process.env.S3_CORS_ORIGINS ?? (isProd ? "" : "http://localhost:3000"))
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((o) => o !== "*");

    if (origins.length === 0) {
      return;
    }

    try {
      await this.client.send(
        new PutBucketCorsCommand({
          Bucket: this.bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedOrigins: origins,
                AllowedMethods: ["GET", "PUT", "HEAD"],
                AllowedHeaders: ["*"],
                ExposeHeaders: ["ETag", "x-amz-request-id"],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      );
    } catch {
      // R2/S3 may already have CORS via console; ignore transient failures
    }

    if (process.env.S3_ENABLE_WEBSITE === "false") return;

    try {
      await this.client.send(
        new PutBucketWebsiteCommand({
          Bucket: this.bucket,
          WebsiteConfiguration: {
            IndexDocument: { Suffix: "index.html" },
          },
        }),
      );
    } catch {
      // R2 public buckets use a different public URL; website API may be unsupported
    }
  }

  async createPresignedUpload(contentType: string, folder = "uploads") {
    const type = contentType.trim().toLowerCase();
    const safeFolder = (folder ?? "uploads").trim().replace(/^\/+|\/+$/g, "");

    if (!ALLOWED_FOLDERS.has(safeFolder)) {
      throw new BadRequestException(
        `folder inválido — permitido: ${[...ALLOWED_FOLDERS].join(", ")}.`,
      );
    }

    const isPdf = type === "application/pdf";
    if (isPdf && safeFolder !== "protocols") {
      throw new BadRequestException(
        "application/pdf só é permitido na pasta protocols.",
      );
    }
    if (!isPdf && !ALLOWED_IMAGE_TYPES.has(type)) {
      throw new BadRequestException(
        "contentType inválido — use image/jpeg, image/png ou image/webp.",
      );
    }

    const ext = EXT_BY_TYPE[type] ?? "bin";
    const key = `${safeFolder}/${randomUUID()}.${ext}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: type,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: 600,
      signableHeaders: new Set(["content-type"]),
    });
    return {
      key,
      uploadUrl,
      publicUrl: this.getPublicUrl(key),
    };
  }

  getPublicUrl(key: string) {
    const base = this.publicUrl.replace(/\/$/, "");
    if (this.includeBucketInPublicUrl) {
      return `${base}/${this.bucket}/${key}`;
    }
    return `${base}/${key}`;
  }

  /** Used by /api/ready */
  async pingBucket(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }
}
