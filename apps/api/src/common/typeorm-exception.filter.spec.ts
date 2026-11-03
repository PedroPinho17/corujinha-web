import { describe, expect, it, vi } from "vitest";
import { EntityNotFoundError, QueryFailedError } from "typeorm";
import { TypeOrmExceptionFilter } from "./typeorm-exception.filter";

function makeHost(status: ReturnType<typeof vi.fn>, json: ReturnType<typeof vi.fn>) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({ status, json }),
    }),
  };
}

describe("TypeOrmExceptionFilter", () => {
  it("maps EntityNotFoundError to 404", () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const filter = new TypeOrmExceptionFilter();
    const err = new EntityNotFoundError("User", { id: "x" });
    filter.catch(err, makeHost(status, json) as never);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, code: "ENTITY_NOT_FOUND" }),
    );
  });

  it("maps unique violation 23505 to 409", () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const filter = new TypeOrmExceptionFilter();
    const err = Object.assign(new QueryFailedError("INSERT", [], new Error("dup")), {
      driverError: { code: "23505" },
    });
    filter.catch(err, makeHost(status, json) as never);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, code: "23505" }),
    );
  });
});
