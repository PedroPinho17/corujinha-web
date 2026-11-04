import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { DataSource, type DataSourceOptions } from "typeorm";
import { entities } from "./entities";
import { InitialSchema1730000000000 } from "./migrations/1730000000000-InitialSchema";
import { UpdatedAtDefaults1730000001000 } from "./migrations/1730000001000-UpdatedAtDefaults";
import { DropLegacyMigrationsTable1730000002000 } from "./migrations/1730000002000-DropLegacyMigrationsTable";

for (const path of [
  resolve(__dirname, "../../../.env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../../.env"),
]) {
  if (existsSync(path)) {
    loadEnv({ path });
    break;
  }
}

export function buildDataSourceOptions(): DataSourceOptions {
  // Allow constructing the DataSource at import time (Better Auth / Nest);
  // real connectivity still requires DATABASE_URL when initialize() runs.
  const url = process.env.DATABASE_URL ?? "postgresql://localhost:5432/corujinha";

  return {
    type: "postgres",
    url,
    entities,
    migrations: [
      InitialSchema1730000000000,
      UpdatedAtDefaults1730000001000,
      DropLegacyMigrationsTable1730000002000,
    ],
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };
}

const globalForDs = globalThis as unknown as { __corujinhaDataSource?: DataSource };

export const AppDataSource =
  globalForDs.__corujinhaDataSource ?? new DataSource(buildDataSourceOptions());

if (process.env.NODE_ENV !== "production") {
  globalForDs.__corujinhaDataSource = AppDataSource;
}

export async function ensureDataSource(): Promise<DataSource> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
}
