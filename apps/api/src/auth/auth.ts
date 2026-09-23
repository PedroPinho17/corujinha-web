import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@corujinha/database";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const authUrl = process.env.BETTER_AUTH_URL ?? appUrl;
const rpID = process.env.WEBAUTHN_RP_ID ?? "localhost";

export const auth = betterAuth({
  appName: "Corujinha",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: authUrl,
  basePath: "/api/auth",
  trustedOrigins: [appUrl, authUrl, "http://localhost:3000", "http://localhost:3001"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
  },
  session: {
    // Avoid stale mustChangePassword / role after profile updates
    cookieCache: {
      enabled: false,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "EDITOR",
        input: false,
      },
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  plugins: [
    passkey({
      rpID,
      rpName: "Corujinha",
      origin: appUrl,
    }),
  ],
});

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  mustChangePassword?: boolean;
};
