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
import { SlidingWindowRateLimiter, clientIp } from "./common/rate-limit";

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

  app.set("trust proxy", 1);
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
  const authLimiter = new SlidingWindowRateLimiter(20, 15 * 60 * 1000);
  const authHandler = toNodeHandler(auth);
  expressApp.use((req: Request, res: Response, next: () => void) => {
    if (!req.path.startsWith("/api/auth")) return next();
    if (
      req.method === "POST" &&
      (req.path.includes("sign-in") || req.path.includes("sign-up"))
    ) {
      const ip = clientIp(req);
      if (!authLimiter.allow(`auth:${ip}`)) {
        res.status(429).json({ message: "Demasiados pedidos. Tenta mais tarde." });
        return;
      }
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
