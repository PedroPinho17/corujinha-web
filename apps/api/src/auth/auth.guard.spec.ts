import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";

const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("./auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

vi.mock("better-auth/node", () => ({
  fromNodeHeaders: (headers: unknown) => headers,
}));

import { AdminGuard, AuthGuard, SuperAdminGuard } from "./auth.guard";

function fakeContext(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as ExecutionContext;
}

describe("AuthGuard", () => {
  const guard = new AuthGuard();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws UnauthorizedException when there is no session", async () => {
    getSession.mockResolvedValue(null);
    await expect(guard.canActivate(fakeContext({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("sets req.user and returns true when session exists", async () => {
    const user = { id: "u1", email: "a@example.com" };
    const session = { id: "s1" };
    getSession.mockResolvedValue({ user, session });
    const req: Record<string, unknown> = { headers: {} };
    await expect(guard.canActivate(fakeContext(req))).resolves.toBe(true);
    expect(req.user).toEqual(user);
    expect(req.session).toEqual(session);
  });
});

describe("AdminGuard", () => {
  const guard = new AdminGuard();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws UnauthorizedException when there is no session", async () => {
    getSession.mockResolvedValue(null);
    await expect(guard.canActivate(fakeContext({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("throws ForbiddenException when role is missing or invalid", async () => {
    getSession.mockResolvedValue({ user: { id: "u1" }, session: {} });
    await expect(guard.canActivate(fakeContext({ headers: {} }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    getSession.mockResolvedValue({ user: { id: "u1", role: "NONE" }, session: {} });
    await expect(guard.canActivate(fakeContext({ headers: {} }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("throws MUST_CHANGE_PASSWORD when mustChangePassword is true", async () => {
    getSession.mockResolvedValue({
      user: { id: "u1", role: "ADMIN", mustChangePassword: true },
      session: {},
    });
    const err = await guard.canActivate(fakeContext({ headers: {} })).catch((e) => e);
    expect(err.getResponse()).toMatchObject({ code: "MUST_CHANGE_PASSWORD" });
  });

  it("allows ADMIN and EDITOR without mustChangePassword", async () => {
    for (const role of ["ADMIN", "EDITOR"]) {
      const user = { id: "u1", role, mustChangePassword: false };
      getSession.mockResolvedValue({ user, session: { id: "s1" } });
      const req: Record<string, unknown> = { headers: {} };
      await expect(guard.canActivate(fakeContext(req))).resolves.toBe(true);
      expect(req.user).toEqual(user);
    }
  });
});

describe("SuperAdminGuard", () => {
  const guard = new SuperAdminGuard();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-ADMIN and mustChangePassword", async () => {
    getSession.mockResolvedValue(null);
    await expect(guard.canActivate(fakeContext({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    getSession.mockResolvedValue({
      user: { id: "u1", role: "EDITOR", mustChangePassword: false },
      session: {},
    });
    await expect(guard.canActivate(fakeContext({ headers: {} }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    getSession.mockResolvedValue({
      user: { id: "u1", role: "ADMIN", mustChangePassword: true },
      session: {},
    });
    const err = await guard.canActivate(fakeContext({ headers: {} })).catch((e) => e);
    expect(err.getResponse()).toMatchObject({ code: "MUST_CHANGE_PASSWORD" });
  });

  it("allows ADMIN", async () => {
    const user = { id: "u1", role: "ADMIN", mustChangePassword: false };
    getSession.mockResolvedValue({ user, session: {} });
    const req: Record<string, unknown> = { headers: {} };
    await expect(guard.canActivate(fakeContext(req))).resolves.toBe(true);
    expect(req.user).toEqual(user);
  });
});
