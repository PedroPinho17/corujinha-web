-- CreateTable
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Center_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Center_slug_key" ON "Center"("slug");

-- CreateIndex
CREATE INDEX "Center_published_sortOrder_idx" ON "Center"("published", "sortOrder");

-- AlterTable
ALTER TABLE "GalleryImage" ADD COLUMN "centerId" TEXT;

-- CreateIndex
CREATE INDEX "GalleryImage_centerId_idx" ON "GalleryImage"("centerId");

-- CreateIndex
CREATE INDEX "GalleryImage_album_idx" ON "GalleryImage"("album");

-- AddForeignKey
ALTER TABLE "GalleryImage" ADD CONSTRAINT "GalleryImage_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the three current centres
INSERT INTO "Center" ("id", "slug", "name", "shortName", "address", "city", "postalCode", "isPrimary", "sortOrder", "published", "updatedAt")
VALUES
  ('center_lobao', 'lobao', 'Centro Lobão', 'Lobão', 'R. Namorados 566', 'Lobão', '4505-444', true, 1, true, CURRENT_TIMESTAMP),
  ('center_sjv', 'sao-joao-de-ver', 'Centro São João de Ver', 'São João de Ver', 'Av. Dr. Francisco Sá Carneiro 1192 Loja H', 'São João de Ver', '4520-617', false, 2, true, CURRENT_TIMESTAMP),
  ('center_sanguedo', 'sanguedo', 'Centro Sanguedo', 'Sanguedo', NULL, 'Sanguedo', NULL, false, 3, true, CURRENT_TIMESTAMP);

-- Link legacy gallery album keys to centres
UPDATE "GalleryImage" AS g
SET "centerId" = c."id",
    "album" = c."slug"
FROM "Center" AS c
WHERE g."album" IN ('caldas', 'lobao', 'lobão')
  AND c."slug" = 'lobao';

UPDATE "GalleryImage" AS g
SET "centerId" = c."id",
    "album" = c."slug"
FROM "Center" AS c
WHERE g."album" IN ('sao-joao', 'sao-joao-de-ver', 'são joão de ver')
  AND c."slug" = 'sao-joao-de-ver';
