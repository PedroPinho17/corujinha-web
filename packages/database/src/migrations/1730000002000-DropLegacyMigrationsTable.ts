import type { MigrationInterface, QueryRunner } from "typeorm";

/** Removes the migration history table left by the previous ORM; nothing reads it. */
export class DropLegacyMigrationsTable1730000002000 implements MigrationInterface {
  name = "DropLegacyMigrationsTable1730000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "_prisma_migrations"`);
  }

  public async down(): Promise<void> {
    // Intentionally empty: the dropped history has no use and is not restored.
  }
}
