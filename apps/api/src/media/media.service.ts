import { Injectable, OnModuleInit } from "@nestjs/common";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

@Injectable()
export class MediaService implements OnModuleInit {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "corujinha-media";
    this.publicUrl = process.env.S3_PUBLIC_URL ?? "http://localhost:9012";
    this.client = new S3Client({
      region: process.env.S3_REGION ?? "us-east-1",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? "minioadmin",
        secretAccessKey: process.env.S3_SECRET_KEY ?? "minioadmin",
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch {
        // bucket may already exist
      }
    }
  }

  async createPresignedUpload(contentType: string, folder = "uploads") {
    const ext = contentType.split("/")[1] ?? "bin";
    const key = `${folder}/${randomUUID()}.${ext}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 600 });
    return {
      key,
      uploadUrl,
      publicUrl: this.getPublicUrl(key),
    };
  }

  getPublicUrl(key: string) {
    return `${this.publicUrl.replace(/\/$/, "")}/${this.bucket}/${key}`;
  }
}
