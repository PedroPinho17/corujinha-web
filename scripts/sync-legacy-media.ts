/**
 * Upload legacy public/ media to MinIO/S3 and copy static assets to apps/web/public.
 * Does NOT wipe or modify the database.
 *
 * Usage: pnpm sync:legacy-media
 */
import { config as loadEnv } from "dotenv";
import { resolve, join, extname, basename, relative } from "path";
import { createReadStream, existsSync, mkdirSync, copyFileSync } from "fs";
import { readdir, stat } from "fs/promises";
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";

loadEnv({ path: resolve(process.cwd(), ".env") });

const LEGACY_PUBLIC_DIR =
  process.env.LEGACY_PUBLIC_DIR ?? "C:\\Projetos_WEB\\corujinha\\public";
const WEB_PUBLIC = resolve(process.cwd(), "apps/web/public");

const IMAGE_EXT = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg"]);

const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "minioadmin",
  },
});
const bucket = process.env.S3_BUCKET ?? "corujinha-media";

function contentType(file: string) {
  const e = extname(file).toLowerCase();
  if (e === ".webp") return "image/webp";
  if (e === ".png") return "image/png";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".gif") return "image/gif";
  if (e === ".ico") return "image/x-icon";
  if (e === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

async function uploadFile(localPath: string, key: string) {
  const body = createReadStream(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType(localPath),
    }),
  );
  console.log("  S3:", key);
}

async function walkFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkFiles(p)));
    else if (IMAGE_EXT.has(extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

function copyToWebPublic(from: string, relDest: string) {
  const dest = join(WEB_PUBLIC, relDest);
  mkdirSync(resolve(dest, ".."), { recursive: true });
  copyFileSync(from, dest);
  console.log("  public:", relDest);
}

async function main() {
  console.log("Legacy dir:", LEGACY_PUBLIC_DIR);
  await ensureBucket();
  console.log("Bucket:", bucket);

  // --- CMS media → S3 (same keys as migrate-legacy) ---
  const teamsDir = join(LEGACY_PUBLIC_DIR, "img", "teams");
  for (const file of await walkFiles(teamsDir)) {
    await uploadFile(file, `teams/${basename(file)}`);
  }

  const postsDir = join(LEGACY_PUBLIC_DIR, "img", "posts");
  for (const file of await walkFiles(postsDir)) {
    await uploadFile(file, `posts/${basename(file)}`);
  }

  const galleryRoot = join(LEGACY_PUBLIC_DIR, "gallery");
  for (const file of await walkFiles(galleryRoot)) {
    const rel = relative(galleryRoot, file).replace(/\\/g, "/");
    await uploadFile(file, `gallery/${rel}`);
  }

  // Other img/ files → S3 static/img/ (backup + future use)
  const imgRoot = join(LEGACY_PUBLIC_DIR, "img");
  for (const file of await walkFiles(imgRoot)) {
    const rel = relative(imgRoot, file).replace(/\\/g, "/");
    if (rel.startsWith("teams/") || rel.startsWith("posts/")) continue;
    await uploadFile(file, `static/img/${rel}`);
  }

  // --- Static assets → apps/web/public ---
  const staticCopies: [string, string][] = [
    ["logo.webp", "logo.webp"],
    ["logo1.webp", "logo1.webp"],
    ["Vera.webp", "Vera.webp"],
    ["favicon.ico", "favicon.ico"],
    ["img/perfil.png", "img/perfil.png"],
    ["img/back.png", "img/back.png"],
    ["img/copy.png", "img/copy.png"],
    ["img/seta_cima.png", "img/seta_cima.png"],
  ];

  for (const [src, dest] of staticCopies) {
    const from = join(LEGACY_PUBLIC_DIR, src);
    if (existsSync(from)) copyToWebPublic(from, dest);
  }

  const faviconsDir = join(LEGACY_PUBLIC_DIR, "favicons");
  if (existsSync(faviconsDir)) {
    for (const file of await walkFiles(faviconsDir)) {
      const rel = relative(faviconsDir, file).replace(/\\/g, "/");
      copyToWebPublic(file, join("favicons", rel).replace(/\\/g, "/"));
    }
  }

  console.log("\nMedia sync complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
