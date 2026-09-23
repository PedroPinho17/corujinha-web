import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { json, urlencoded, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import * as Sentry from "@sentry/nestjs";
import { AppModule } from "./app.module";
import { auth } from "./auth/auth";

async function bootstrap() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }

  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.enableCors({
    origin: [
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  const authHandler = toNodeHandler(auth);
  expressApp.use((req: Request, res: Response, next: () => void) => {
    if (req.path.startsWith("/api/auth")) {
      return authHandler(req, res);
    }
    return next();
  });

  expressApp.use(json({ limit: "10mb" }));
  expressApp.use(urlencoded({ extended: true }));

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

bootstrap();
