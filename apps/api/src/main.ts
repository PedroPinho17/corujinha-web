import "reflect-metadata";
import "./env";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { json, urlencoded, Request, Response } from "express";
import helmet from "helmet";
import { toNodeHandler } from "better-auth/node";
import * as Sentry from "@sentry/nestjs";
import { AppModule } from "./app.module";
import { auth } from "./auth/auth";
import { assertProductionEnv } from "./env";
import { RedisRateLimiter, clientIp } from "./common/rate-limit";
import { RedisService } from "./redis/redis.service";

function isAuthRateLimitedPath(method: string, path: string): boolean {
  if (method !== "POST") return false;
  return (
    path.includes("sign-in") ||
    path.includes("sign-up") ||
    path.includes("forget-password") ||
    path.includes("request-password-reset")
  );
}

async function bootstrap() {
  assertProductionEnv();

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const trustHops = Number(process.env.TRUST_PROXY_HOPS ?? "1");
  app.set("trust proxy", Number.isFinite(trustHops) && trustHops >= 0 ? trustHops : 1);
  app.use(helmet());

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const corsOrigins =
    process.env.NODE_ENV === "production"
      ? [appUrl]
      : [appUrl, "http://localhost:3000", "http://localhost:3001"];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  const redis = app.get(RedisService);
  /** 5 falhas de login / 15 min por IP — Redis partilhado entre réplicas. */
  const authLimiter = new RedisRateLimiter(redis.client, 5, 15 * 60 * 1000, "rl:auth");
  const authHandler = toNodeHandler(auth);

  expressApp.use(async (req: Request, res: Response, next: () => void) => {
    if (!req.path.startsWith("/api/auth")) return next();

    if (isAuthRateLimitedPath(req.method, req.path)) {
      const ip = clientIp(req);
      const key = `auth:${ip}`;
      if (!(await authLimiter.check(key))) {
        res.status(429).json({
          message: "Demasiadas tentativas. Aguarde alguns minutos e tente novamente.",
        });
        return;
      }

      const originalEnd = res.end.bind(res);
      // Count only client/auth failures — not successes or 429.
      res.end = ((...args: Parameters<typeof res.end>) => {
        const code = res.statusCode;
        if (code === 400 || code === 401 || code === 403) {
          void authLimiter.hit(key);
        }
        return originalEnd(...args);
      }) as typeof res.end;
    }

    return authHandler(req, res);
  });

  expressApp.use(json({ limit: "100kb" }));
  expressApp.use(urlencoded({ extended: true, limit: "100kb" }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

void bootstrap();
