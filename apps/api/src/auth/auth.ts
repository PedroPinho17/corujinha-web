import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@corujinha/database";
import { resolveAuthSecret } from "../env";
import { sendMail } from "../mail/send-mail";
import { authEmailPassword } from "./auth.config";
import { buildResetPasswordMail } from "./reset-password-mail";

export { authEmailPassword } from "./auth.config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const authUrl = process.env.BETTER_AUTH_URL ?? appUrl;
const rpID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const isProd = process.env.NODE_ENV === "production";

/** Local hosts browsers treat as different origins (localhost ≠ 127.0.0.1). */
const localOrigins = [
  appUrl,
  authUrl,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://[::1]:3000",
  "http://[::1]:3001",
];

const trustedOrigins = isProd
  ? [...new Set([appUrl, authUrl].filter(Boolean))]
  : [...new Set(localOrigins.filter(Boolean))];

/**
 * Better Auth — registo público desactivado (contas só via seed / admin).
 * Papel por omissão EDITOR só aplica a contas criadas por admin (sign-up fechado).
 */
export const auth = betterAuth({
  appName: "Corujinha",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: resolveAuthSecret(),
  baseURL: authUrl,
  basePath: "/api/auth",
  trustedOrigins,
  emailAndPassword: {
    ...authEmailPassword,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 3600,
    // Fire-and-forget: awaiting would leak timing (user exists vs not).
    sendResetPassword: async ({ user, url }) => {
      const mail = buildResetPasswordMail(user.name || "admin", url);
      void sendMail({
        to: user.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
    },
    onPasswordReset: async ({ user }) => {
      await prisma.user.update({
        where: { id: user.id },
        data: { mustChangePassword: false },
      });
    },
  },
  session: {
    cookieCache: {
      enabled: false,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: isProd && process.env.ALLOW_INSECURE_S3 !== "true",
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
