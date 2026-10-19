"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { adminFetch } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function redirectAfterLogin() {
  const me = await adminFetch<{ user: { mustChangePassword?: boolean } | null }>("/api/me");
  const mustChange = Boolean(me.user?.mustChangePassword);
  window.location.assign(mustChange ? "/admin/change-password" : "/admin");
}

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (err) {
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("too many") || msg.includes("rate") || msg.includes("429")) {
        setError("Demasiadas tentativas. Aguarde alguns minutos e tente novamente.");
      } else if (msg.includes("invalid") || msg.includes("credential") || msg.includes("password")) {
        setError("Email ou password incorretos.");
      } else {
        setError(err.message || "Não foi possível entrar. Tente novamente.");
      }
      return;
    }
    try {
      await redirectAfterLogin();
    } catch {
      window.location.assign("/admin");
    }
  }

  async function passkeyLogin() {
    setError("");
    setLoading(true);
    try {
      const { error: err } = await authClient.signIn.passkey();
      if (err) {
        setError(err.message || "Passkey falhou");
        return;
      }
      await redirectAfterLogin();
    } catch {
      setError("Passkey falhou — confirma que já registaste uma passkey em Segurança");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/logo.webp" alt="Corujinha" width={80} height={80} className="h-16 w-16 object-contain" />
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Backoffice Corujinha</h1>
          <p className="text-sm text-slate-500">Entre para gerir o conteúdo</p>
        </div>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/admin/forgot-password"
                className="text-xs font-medium text-pink hover:underline"
              >
                Esqueci-me da password
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "A entrar..." : "Entrar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={passkeyLogin}
            disabled={loading}
            className="w-full"
          >
            Entrar com passkey
          </Button>
          <p className="text-center text-xs text-slate-400">
            Primeira vez? Entra com email/password e regista a passkey em Segurança.
          </p>
        </div>
      </form>
    </div>
  );
}
