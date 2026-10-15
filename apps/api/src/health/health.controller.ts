import { Controller, Get } from "@nestjs/common";

@Controller("api/health")
export class HealthController {
  @Get()
  check() {
    return {
      status: "ok",
      ok: true,
      service: "corujinha-api",
      ts: new Date().toISOString(),
    };
  }
}
