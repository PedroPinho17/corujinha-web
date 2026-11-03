import type { ObjectLiteral, Repository } from "typeorm";

/** Next sortOrder = max(existing) + 1 (or 1 when empty). */
export async function nextSortOrder<T extends ObjectLiteral>(
  repo: Repository<T>,
  alias = "t",
): Promise<number> {
  const raw = await repo
    .createQueryBuilder(alias)
    .select(`MAX(${alias}.sortOrder)`, "max")
    .getRawOne<{ max: string | number | null }>();
  return (Number(raw?.max) || 0) + 1;
}
