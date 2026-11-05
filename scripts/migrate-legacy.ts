/**
 * Migrate Laravel Corujinha (MySQL + public/) → Postgres (TypeORM) + S3/MinIO.
 *
 * Usage (from repo root, with Docker infra up):
 *   pnpm migrate:legacy
 *
 * Env:
 *   LEGACY_MYSQL_URL=mysql://root@127.0.0.1:3306/corujinha_db
 *   LEGACY_PUBLIC_DIR=C:\Projetos_WEB\corujinha\public
 *   LEGACY_USER_TEMP_PASSWORD=Migrated123!
 *   DATABASE_URL / S3_* from root .env
 */
import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { createReadStream, existsSync } from "fs";
import { readdir, stat } from "fs/promises";
import { join, extname, basename } from "path";
import mysql from "mysql2/promise";
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import {
  Account,
  Center,
  ContactMessage,
  Entity,
  Formation,
  GalleryImage,
  Passkey,
  Post,
  SchoolProtocol,
  Session,
  SiteSettings,
  TeamMember,
  User,
  UserRole,
  ensureDataSource,
  AppDataSource,
} from "@corujinha/database";
import { hashPassword } from "better-auth/crypto";

loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), "../../.env") });

const LEGACY_MYSQL_URL =
  process.env.LEGACY_MYSQL_URL ?? "mysql://root@127.0.0.1:3306/corujinha_db";
const LEGACY_PUBLIC_DIR =
  process.env.LEGACY_PUBLIC_DIR ?? "C:\\Projetos_WEB\\corujinha\\public";
const TEMP_PASSWORD = process.env.LEGACY_USER_TEMP_PASSWORD ?? "Migrated123!";

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
  return "application/octet-stream";
}

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

async function uploadFile(localPath: string, key: string): Promise<string | null> {
  if (!existsSync(localPath)) {
    console.warn(`  missing file: ${localPath}`);
    return null;
  }
  const body = createReadStream(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType(localPath),
    }),
  );
  return key;
}

async function walkFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkFiles(p)));
    else out.push(p);
  }
  return out;
}

function emptyToNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === "0" || s === "0000-00-00 00:00:00") return null;
  return s;
}

async function main() {
  const ds = await ensureDataSource();
  const contactMessages = ds.getRepository(ContactMessage);
  const galleryImages = ds.getRepository(GalleryImage);
  const schoolProtocols = ds.getRepository(SchoolProtocol);
  const formations = ds.getRepository(Formation);
  const entities = ds.getRepository(Entity);
  const posts = ds.getRepository(Post);
  const teamMembers = ds.getRepository(TeamMember);
  const sessions = ds.getRepository(Session);
  const accounts = ds.getRepository(Account);
  const passkeys = ds.getRepository(Passkey);
  const users = ds.getRepository(User);
  const siteSettings = ds.getRepository(SiteSettings);

  console.log("Connecting to legacy MySQL…");
  const conn = await mysql.createConnection(LEGACY_MYSQL_URL);

  await ensureBucket();
  console.log("S3 bucket ready:", bucket);

  // --- Clear CMS data (keep auth if any, then recreate users from legacy) ---
  console.log("Clearing target CMS tables…");
  await contactMessages.clear();
  await galleryImages.clear();
  await schoolProtocols.clear();
  await formations.clear();
  await entities.clear();
  await posts.clear();
  await teamMembers.clear();
  // Remove non-seed approach: wipe all users + accounts + sessions + passkeys for clean import
  await sessions.clear();
  await accounts.clear();
  await passkeys.clear();
  await users.clear();

  // --- Entities ---
  const [legacyEntities] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT * FROM entities ORDER BY ordem ASC, id ASC",
  );
  const entityIdMap = new Map<number, string>();
  for (const row of legacyEntities) {
    const created = await entities.save(
      entities.create({
        name: String(row.name),
        description: emptyToNull(row.description),
        location: emptyToNull(row.location),
        website: emptyToNull(row.website),
        sortOrder: Number(row.ordem) || 0,
        published: true,
      }),
    );
    entityIdMap.set(Number(row.id), created.id);
    console.log("entity:", created.name);
  }

  // --- Formations ---
  const [legacyFormations] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT * FROM formations ORDER BY ordem ASC, id ASC",
  );
  for (const row of legacyFormations) {
    const entityId = entityIdMap.get(Number(row.id_entity)) ?? null;
    await formations.save(
      formations.create({
        name: String(row.name),
        description: emptyToNull(row.description),
        duration: emptyToNull(row.duration),
        location: emptyToNull(row.location),
        entityId,
        active: Boolean(row.active),
        sortOrder: Number(row.ordem) || 0,
      }),
    );
    console.log("formation:", row.name);
  }

  // --- Team ---
  const [teams] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT * FROM team ORDER BY ordem ASC, id ASC",
  );
  for (const row of teams) {
    const filename = emptyToNull(row.image);
    let imageKey: string | null = null;
    if (filename) {
      const local = join(LEGACY_PUBLIC_DIR, "img", "teams", filename);
      imageKey = await uploadFile(local, `teams/${filename}`);
    }
    await teamMembers.save(
      teamMembers.create({
        name: String(row.name),
        description: emptyToNull(row.description),
        imageKey,
        sortOrder: Number(row.ordem) || 0,
        published: true,
      }),
    );
    console.log("team:", row.name, imageKey);
  }

  // --- Posts ---
  const [legacyPosts] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT * FROM posts ORDER BY ordem ASC, id ASC",
  );
  for (const row of legacyPosts) {
    const filename = emptyToNull(row.image);
    let imageKey: string | null = null;
    if (filename) {
      const candidates = [
        join(LEGACY_PUBLIC_DIR, "img", "posts", filename),
        join(LEGACY_PUBLIC_DIR, "img", filename),
        join(LEGACY_PUBLIC_DIR, filename),
      ];
      for (const local of candidates) {
        if (existsSync(local)) {
          imageKey = await uploadFile(local, `posts/${basename(local)}`);
          break;
        }
      }
      if (!imageKey) console.warn(`  post image not found: ${filename}`);
    }
    const phone = row.phone != null && String(row.phone) !== "0" ? String(row.phone) : null;
    await posts.save(
      posts.create({
        title: String(row.title),
        content: emptyToNull(row.content),
        link: emptyToNull(row.link),
        phone,
        email: emptyToNull(row.email),
        featured: Boolean(row.feature),
        imageKey,
        published: true,
        publishedAt: row.published_at ? new Date(row.published_at) : new Date(),
        sortOrder: Number(row.ordem) || 0,
      }),
    );
    console.log("post:", row.title, imageKey);
  }

  // --- Protocols ---
  const [protocols] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT * FROM school_protocols ORDER BY ordem ASC, id ASC",
  );
  for (const row of protocols) {
    await schoolProtocols.save(
      schoolProtocols.create({
        schoolName: String(row.school_name),
        link: emptyToNull(row.link),
        active: Boolean(row.ativo),
        sortOrder: Number(row.ordem) || 0,
      }),
    );
    console.log("protocol:", row.school_name);
  }

  // --- Gallery (static folders) ---
  const galleryRoot = join(LEGACY_PUBLIC_DIR, "gallery");
  const galleryFiles = await walkFiles(galleryRoot);
  let gOrder = 0;
  for (const file of galleryFiles) {
    const rel = file.slice(galleryRoot.length + 1).replace(/\\/g, "/");
    const album = rel.includes("/") ? rel.split("/")[0] : "geral";
    const key = await uploadFile(file, `gallery/${rel}`);
    if (!key) continue;
    gOrder += 1;
    await galleryImages.save(
      galleryImages.create({
        imageKey: key,
        alt: basename(file),
        album,
        sortOrder: gOrder,
        published: true,
      }),
    );
    console.log("gallery:", key);
  }

  // --- Users (Better Auth accounts; passwords re-hashed — set temp + mustChangePassword) ---
  const passwordHash = await hashPassword(TEMP_PASSWORD);
  const [legacyUsers] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT * FROM utilizadores ORDER BY id ASC",
  );
  for (const row of legacyUsers) {
    const role = Number(row.id_permissao) === 1 ? UserRole.ADMIN : UserRole.EDITOR;
    const mustChange =
      Boolean(row.mudanca_password) || true; // force reset: bcrypt ≠ better-auth hash
    const email = String(row.email).toLowerCase();
    const user = await users.save(
      users.create({
        email,
        name: String(row.nome),
        emailVerified: true,
        role,
        mustChangePassword: mustChange,
      }),
    );
    await accounts.save(
      accounts.create({
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      }),
    );
    console.log("user:", user.email, role, `(temp password → must change)`);
  }

  // Site settings
  const existingSettings = await siteSettings.find({ take: 1 }).then((r) => r[0] ?? null);
  if (!existingSettings) {
    await siteSettings.save(
      siteSettings.create({
        brandingName: "Corujinha",
        contactEmail: process.env.CONTACT_NOTIFY_TO ?? null,
      }),
    );
  }

  await conn.end();

  const summary = {
    entities: await entities.count(),
    formations: await formations.count(),
    team: await teamMembers.count(),
    posts: await posts.count(),
    protocols: await schoolProtocols.count(),
    gallery: await galleryImages.count(),
    users: await users.count(),
  };
  console.log("\nMigration complete:", summary);
  console.log(`Temp password for all users: ${TEMP_PASSWORD}`);
  console.log("(mustChangePassword=true — change on first login)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });
