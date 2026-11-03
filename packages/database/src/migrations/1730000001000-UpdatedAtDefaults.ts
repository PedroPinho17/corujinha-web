import type { MigrationInterface, QueryRunner } from "typeorm";

const TABLES = [
  "user",
  "session",
  "account",
  "verification",
  "TeamMember",
  "Post",
  "Entity",
  "Formation",
  "SchoolProtocol",
  "Center",
  "GalleryImage",
  "ContactMessage",
  "SiteSettings",
] as const;

/**
 * Prisma left updatedAt NOT NULL without DEFAULT; TypeORM inserts DEFAULT → NULL.
 * Align with createdAt: DEFAULT CURRENT_TIMESTAMP.
 */
export class UpdatedAtDefaults1730000001000 implements MigrationInterface {
  name = "UpdatedAtDefaults1730000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const has = await queryRunner.hasTable(table);
      if (!has) continue;
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP`,
      );
      await queryRunner.query(
        `UPDATE "${table}" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const has = await queryRunner.hasTable(table);
      if (!has) continue;
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "updatedAt" DROP DEFAULT`,
      );
    }
  }
}
