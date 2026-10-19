import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { passkey } from "@better-auth/passkey";
import { prisma } from "@corujinha/database";
import { resolveAuthSecret } from "../env";
import { escapeHtml } from "../common/escape-html";
import { renderEmailHtml } from "../mail/email-layout";
import { sendMail } from "../mail/send-mail";
import { authEmailPassword } from "./auth.config";

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
      const name = user.name || "admin";
      void sendMail({
        to: user.email,
        subject: "Recuperar password — Corujinha",
        text: [
          `Olá ${name},`,
          "",
          "Recebemos um pedido para redefinir a password do backoffice Corujinha.",
          "Abre este link (válido durante 1 hora):",
          url,
          "",
          "Se não pediste esta alteração, ignora este email.",
          "",
          "— Centro de Apoio Escolar Corujinha",
        ].join("\n"),
        html: renderEmailHtml({
          title: "Recuperar password",
          preheader: "Link para definir uma nova password (válido 1 hora)",
          bodyHtml: `<p>Olá <strong>${escapeHtml(name)}</strong>,</p>
<p>Recebemos um pedido para redefinir a password do backoffice Corujinha.</p>
<p>O link é válido durante <strong>1 hora</strong>. Se não pediste esta alteração, podes ignorar este email com segurança.</p>`,
          cta: { label: "Definir nova password", href: url },
        }),
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
