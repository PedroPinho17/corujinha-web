import { describe, expect, it, vi } from "vitest";

vi.mock("@corujinha/database", () => {
  class PrismaClient {
    $connect = vi.fn();
    $disconnect = vi.fn();
  }
  return { PrismaClient };
});

import { PrismaService } from "./prisma.service";

describe("PrismaService", () => {
  it("connects and disconnects", async () => {
    const svc = new PrismaService();
    await svc.onModuleInit();
    await svc.onModuleDestroy();
    expect(svc.$connect).toHaveBeenCalled();
    expect(svc.$disconnect).toHaveBeenCalled();
  });
});
