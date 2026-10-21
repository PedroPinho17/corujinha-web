import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@corujinha/database";
import { PrismaExceptionFilter } from "./prisma-exception.filter";

function makeHost(status: ReturnType<typeof vi.fn>, json: ReturnType<typeof vi.fn>) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status, json }),
    }),
  };
}

describe("PrismaExceptionFilter", () => {
  it("maps P2025 to 404", () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const filter = new PrismaExceptionFilter();
    const err = new Prisma.PrismaClientKnownRequestError("missing", {
      code: "P2025",
      clientVersion: "test",
    });
    filter.catch(err, makeHost(status, json) as never);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "P2025" }),
    );
  });

  it("maps P2002 to 409", () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const filter = new PrismaExceptionFilter();
    const err = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "test",
    });
    filter.catch(err, makeHost(status, json) as never);
    expect(status).toHaveBeenCalledWith(409);
  });
});
