import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { inferAdditionalFields } from "better-auth/client/plugins";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : appUrl,
  plugins: [
    passkeyClient(),
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        mustChangePassword: { type: "boolean" },
      },
    }),
  ],
});
