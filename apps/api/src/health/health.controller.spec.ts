import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns ok status", () => {
    const res = new HealthController().check();
    expect(res.status).toBe("ok");
    expect(res.ok).toBe(true);
    expect(res.service).toBe("corujinha-api");
    expect(res.ts).toBeTruthy();
  });
});
