"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const redirectTo = `${window.location.origin}/admin/reset-password`;
    const { error: err } = await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo,
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Não foi possível enviar o email.");
      return;
    }
    // Always show success — Better Auth does not reveal whether the email exists.
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/logo.webp" alt="Corujinha" width={80} height={80} className="h-16 w-16 object-contain" />
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Esqueci-me da password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enviamos um link de recuperação para o email da conta.
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-600">
              Se existir uma conta com <strong>{email.trim()}</strong>, vais receber um email com o
              link para definir uma nova password (válido 1 hora).
            </p>
            <Link href="/admin/login" className="inline-block text-sm font-medium text-pink hover:underline">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "A enviar..." : "Enviar link de recuperação"}
            </Button>
            <Link
              href="/admin/login"
              className="text-center text-sm text-slate-500 transition hover:text-pink"
            >
              Voltar ao login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
