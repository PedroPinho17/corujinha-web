import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const candidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "..", "..", ".env"),
];

for (const path of candidates) {
  if (existsSync(path)) {
    config({ path });
    break;
  }
}

const DEV_PLACEHOLDER_SECRET = "dev-secret-change-me";

export function resolveAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!secret || secret === DEV_PLACEHOLDER_SECRET || secret.length < 32) {
      throw new Error(
        "BETTER_AUTH_SECRET obrigatório em produção (min. 32 caracteres; não usar o default de desenvolvimento).",
      );
    }
    return secret;
  }

  return secret && secret.length > 0 ? secret : DEV_PLACEHOLDER_SECRET;
}

/** Falha cedo em produção se SMTP / S3 / notify estiverem em falta ou com defaults inseguros. */
export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  resolveAuthSecret();

  const required = [
    "SMTP_HOST",
    "SMTP_FROM",
    "CONTACT_NOTIFY_TO",
    "S3_ENDPOINT",
    "S3_PUBLIC_URL",
    "S3_ACCESS_KEY",
    "S3_SECRET_KEY",
    "S3_BUCKET",
    "S3_CORS_ORIGINS",
  ] as const;

  for (const key of required) {
    const value = process.env[key]?.trim();
    if (!value) {
      throw new Error(`${key} é obrigatório em produção.`);
    }
  }

  const corsOrigins = process.env.S3_CORS_ORIGINS!.trim();
  if (corsOrigins === "*" || corsOrigins.split(",").some((o) => o.trim() === "*")) {
    throw new Error(
      "S3_CORS_ORIGINS não pode ser * em produção — liste as origens HTTPS do site.",
    );
  }

  const notifyTo = process.env.CONTACT_NOTIFY_TO!.trim();
  if (notifyTo.endsWith(".local") || notifyTo.includes("example.com")) {
    throw new Error(
      "CONTACT_NOTIFY_TO deve ser um email real do cliente em produção (não .local).",
    );
  }

  const publicUrl = process.env.S3_PUBLIC_URL!.trim();
  if (!publicUrl.startsWith("https://") && process.env.ALLOW_INSECURE_S3 !== "true") {
    throw new Error(
      "S3_PUBLIC_URL deve usar HTTPS em produção (ou ALLOW_INSECURE_S3=true só para testes).",
    );
  }

  const access = process.env.S3_ACCESS_KEY!.trim();
  const secret = process.env.S3_SECRET_KEY!.trim();
  const forbiddenAccess = new Set([
    "minioadmin",
    "GKabcdef0123456789abcdef01234567",
  ]);
  const forbiddenSecret = new Set([
    "minioadmin",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  ]);
  const forbiddenRpc =
    "a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00";
  if (forbiddenAccess.has(access) || forbiddenSecret.has(secret)) {
    throw new Error(
      "Credenciais S3 de exemplo / por omissão não são permitidas em produção. Gere novas com openssl rand -hex.",
    );
  }
  const rpc = process.env.GARAGE_RPC_SECRET?.trim();
  if (rpc && rpc === forbiddenRpc) {
    throw new Error(
      "GARAGE_RPC_SECRET de exemplo não é permitido em produção. Gere com: openssl rand -hex 32",
    );
  }
}

if (process.env.NODE_ENV === "production") {
  assertProductionEnv();
}
