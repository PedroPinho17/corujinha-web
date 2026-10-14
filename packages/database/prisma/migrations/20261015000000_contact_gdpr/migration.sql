-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN "privacyConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ContactMessage" ADD COLUMN "consentAt" TIMESTAMP(3);
ALTER TABLE "ContactMessage" ADD COLUMN "erasedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ContactMessage_erasedAt_idx" ON "ContactMessage"("erasedAt");
