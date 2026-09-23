-- CreateEnum
CREATE TYPE "ContactKind" AS ENUM ('GENERAL', 'ENROLLMENT');

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "kind" "ContactKind" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "schoolYear" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "adminNotes" TEXT;

-- CreateIndex
CREATE INDEX "ContactMessage_readAt_createdAt_idx" ON "ContactMessage"("readAt", "createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_kind_createdAt_idx" ON "ContactMessage"("kind", "createdAt");
