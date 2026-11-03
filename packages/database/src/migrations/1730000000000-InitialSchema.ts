import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Baseline schema (parity with former Prisma migrations).
 * Safe on existing DBs: skips if the `user` table already exists.
 */
export class InitialSchema1730000000000 implements MigrationInterface {
  name = "InitialSchema1730000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasUser = await queryRunner.hasTable("user");
    if (hasUser) return;

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "public"`);
    await queryRunner.query(`CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR')`);
    await queryRunner.query(`CREATE TYPE "ContactStatus" AS ENUM ('NEW', 'SENT', 'FAILED')`);
    await queryRunner.query(`CREATE TYPE "ContactKind" AS ENUM ('GENERAL', 'ENROLLMENT')`);

    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        "image" TEXT,
        "role" "UserRole" NOT NULL DEFAULT 'EDITOR',
        "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "user_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "session" (
        "id" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "token" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "account" (
        "id" TEXT NOT NULL,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP(3),
        "refreshTokenExpiresAt" TIMESTAMP(3),
        "scope" TEXT,
        "password" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "account_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "verification" (
        "id" TEXT NOT NULL,
        "identifier" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "passkey" (
        "id" TEXT NOT NULL,
        "name" TEXT,
        "publicKey" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "credentialID" TEXT NOT NULL,
        "counter" INTEGER NOT NULL,
        "deviceType" TEXT NOT NULL,
        "backedUp" BOOLEAN NOT NULL,
        "transports" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "aaguid" TEXT,
        CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "TeamMember" (
        "id" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "imageKey" TEXT,
        "translations" JSONB,
        "published" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "Post" (
        "id" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "title" TEXT NOT NULL,
        "content" TEXT,
        "link" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "featured" BOOLEAN NOT NULL DEFAULT false,
        "imageKey" TEXT,
        "translations" JSONB,
        "published" BOOLEAN NOT NULL DEFAULT true,
        "publishedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "Entity" (
        "id" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "location" TEXT,
        "website" TEXT,
        "translations" JSONB,
        "published" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "Formation" (
        "id" TEXT NOT NULL,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "duration" TEXT,
        "location" TEXT,
        "entityId" TEXT,
        "translations" JSONB,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Formation_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "SchoolProtocol" (
        "id" TEXT NOT NULL,
        "schoolName" TEXT NOT NULL,
        "link" TEXT,
        "description" TEXT,
        "documentKey" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SchoolProtocol_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "Center" (
        "id" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "shortName" TEXT,
        "address" TEXT,
        "city" TEXT,
        "postalCode" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "isPrimary" BOOLEAN NOT NULL DEFAULT false,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "published" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Center_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "GalleryImage" (
        "id" TEXT NOT NULL,
        "imageKey" TEXT NOT NULL,
        "alt" TEXT,
        "album" TEXT,
        "centerId" TEXT,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "published" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "ContactMessage" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT,
        "message" TEXT NOT NULL,
        "kind" "ContactKind" NOT NULL DEFAULT 'GENERAL',
        "subject" TEXT,
        "schoolYear" TEXT,
        "location" TEXT,
        "status" "ContactStatus" NOT NULL DEFAULT 'NEW',
        "readAt" TIMESTAMP(3),
        "adminNotes" TEXT,
        "privacyConsent" BOOLEAN NOT NULL DEFAULT false,
        "consentAt" TIMESTAMP(3),
        "erasedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "SiteSettings" (
        "id" TEXT NOT NULL,
        "brandingName" TEXT NOT NULL DEFAULT 'Corujinha',
        "brandingLogoKey" TEXT,
        "contactEmail" TEXT,
        "contactPhone" TEXT,
        "address" TEXT,
        "facebookUrl" TEXT,
        "instagramUrl" TEXT,
        "content" JSONB,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX "user_email_key" ON "user"("email")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "session_token_key" ON "session"("token")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "Center_slug_key" ON "Center"("slug")`);
    await queryRunner.query(`CREATE INDEX "passkey_userId_idx" ON "passkey"("userId")`);
    await queryRunner.query(`CREATE INDEX "session_userId_idx" ON "session"("userId")`);
    await queryRunner.query(`CREATE INDEX "account_userId_idx" ON "account"("userId")`);
    await queryRunner.query(
      `CREATE INDEX "TeamMember_published_sortOrder_idx" ON "TeamMember"("published", "sortOrder")`,
    );
    await queryRunner.query(
      `CREATE INDEX "Post_published_featured_sortOrder_idx" ON "Post"("published", "featured", "sortOrder")`,
    );
    await queryRunner.query(`CREATE INDEX "Post_publishedAt_idx" ON "Post"("publishedAt")`);
    await queryRunner.query(
      `CREATE INDEX "Entity_published_sortOrder_idx" ON "Entity"("published", "sortOrder")`,
    );
    await queryRunner.query(
      `CREATE INDEX "Formation_active_sortOrder_idx" ON "Formation"("active", "sortOrder")`,
    );
    await queryRunner.query(`CREATE INDEX "Formation_entityId_idx" ON "Formation"("entityId")`);
    await queryRunner.query(
      `CREATE INDEX "SchoolProtocol_active_sortOrder_idx" ON "SchoolProtocol"("active", "sortOrder")`,
    );
    await queryRunner.query(
      `CREATE INDEX "Center_published_sortOrder_idx" ON "Center"("published", "sortOrder")`,
    );
    await queryRunner.query(
      `CREATE INDEX "GalleryImage_published_sortOrder_idx" ON "GalleryImage"("published", "sortOrder")`,
    );
    await queryRunner.query(`CREATE INDEX "GalleryImage_centerId_idx" ON "GalleryImage"("centerId")`);
    await queryRunner.query(`CREATE INDEX "GalleryImage_album_idx" ON "GalleryImage"("album")`);
    await queryRunner.query(
      `CREATE INDEX "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ContactMessage_readAt_createdAt_idx" ON "ContactMessage"("readAt", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "ContactMessage_kind_createdAt_idx" ON "ContactMessage"("kind", "createdAt")`,
    );
    await queryRunner.query(`CREATE INDEX "ContactMessage_erasedAt_idx" ON "ContactMessage"("erasedAt")`);

    await queryRunner.query(`
      ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "passkey" ADD CONSTRAINT "passkey_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "Formation" ADD CONSTRAINT "Formation_entityId_fkey"
      FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_centerId_fkey"
      FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "GalleryImage" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Center" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ContactMessage" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "SiteSettings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "SchoolProtocol" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Formation" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Entity" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "Post" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "TeamMember" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "passkey" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "verification" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "account" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "session" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ContactKind"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ContactStatus"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "UserRole"`);
  }
}
