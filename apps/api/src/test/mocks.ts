import { vi } from "vitest";

export function mockRedis() {
  return {
    getJson: vi.fn().mockResolvedValue(null),
    setJson: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
    client: { incr: vi.fn(), pexpire: vi.fn() },
  };
}

export function mockPrisma(modelExtras: Record<string, unknown> = {}) {
  const model = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findUniqueOrThrow: vi.fn().mockResolvedValue({ id: "1", published: true }),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: "1" }),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update: vi.fn().mockResolvedValue({ id: "1" }),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    delete: vi.fn().mockResolvedValue({ id: "1" }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: 0 } }),
    ...modelExtras,
  });
  return {
    teamMember: model(),
    galleryImage: model(),
    center: model(),
    post: model(),
    entity: model(),
    formation: model(),
    schoolProtocol: model(),
    contactMessage: model(),
    siteSettings: model(),
    user: model(),
    account: model(),
    $transaction: vi.fn(async (ops: unknown) => ops),
  };
}
