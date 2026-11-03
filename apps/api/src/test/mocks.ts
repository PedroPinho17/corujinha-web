import { vi } from "vitest";

export function mockRedis() {
  return {
    getJson: vi.fn().mockResolvedValue(null),
    setJson: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    client: { incr: vi.fn(), pexpire: vi.fn() },
  };
}

function chainableQueryBuilder() {
  const qb: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    getRawOne: vi.fn().mockResolvedValue({ max: null }),
    leftJoinAndSelect: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    addOrderBy: vi.fn(),
    getMany: vi.fn().mockResolvedValue([]),
  };
  qb.select.mockReturnValue(qb);
  qb.leftJoinAndSelect.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.addOrderBy.mockReturnValue(qb);
  return qb;
}

/** TypeORM Repository mock — intentionally loose for unit tests. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockRepo(extras: Record<string, unknown> = {}): any {
  const qb = chainableQueryBuilder();
  const repo: Record<string, unknown> = {
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    findOneBy: vi.fn().mockResolvedValue(null),
    findOneByOrFail: vi.fn().mockResolvedValue({ id: "1", published: true }),
    findOneOrFail: vi.fn().mockResolvedValue({ id: "1", center: null }),
    findAndCount: vi.fn().mockResolvedValue([[], 0]),
    create: vi.fn((entity?: object) => ({ ...(entity ?? {}) })),
    save: vi.fn(async (entity: object) => ({ id: "1", ...(entity as object) })),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
    count: vi.fn().mockResolvedValue(0),
    createQueryBuilder: vi.fn(() => qb),
    ...extras,
  };

  repo.manager = {
    transaction: vi.fn(async (cb: (em: { getRepository: () => unknown }) => unknown) => {
      const txRepo = mockRepo();
      return cb({ getRepository: () => txRepo });
    }),
  };

  return repo;
}

export type MockRepo = ReturnType<typeof mockRepo>;
