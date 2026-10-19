"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const tokenError = searchParams.get("error");

  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Link inválido ou expirado. Pede um novo email de recuperação.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword"));
    const confirm = String(form.get("confirm"));
    if (newPassword !== confirm) {
      setError("As passwords não coincidem.");
      return;
    }
    if (newPassword.length < 12) {
      setError("A nova password deve ter pelo menos 12 caracteres.");
      return;
    }

    setLoading(true);
    const { error: err } = await authClient.resetPassword({
      newPassword,
      token,
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Não foi possível redefinir a password. O link pode ter expirado.");
      return;
    }
    setDone(true);
  }

  if (tokenError === "INVALID_TOKEN" || (!token && !done)) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Link inválido</h1>
        <p className="text-sm text-slate-500">
          Este link de recuperação é inválido ou já expirou. Pede um novo a partir do login.
        </p>
        <Link href="/admin/forgot-password" className="inline-block text-sm font-medium text-pink hover:underline">
          Pedir novo link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Password atualizada</h1>
        <p className="text-sm text-slate-600">Já podes iniciar sessão com a nova password.</p>
        <Link
          href="/admin/login"
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-pink px-4 text-sm font-medium text-white hover:bg-pink-dark"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Nova password</h1>
        <p className="mt-1 text-sm text-slate-500">Define uma password forte para o backoffice.</p>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3">
        <div>
          <Label htmlFor="newPassword">Nova password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirm">Confirmar password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "A guardar..." : "Guardar nova password"}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        <div className="mb-2 flex justify-center">
          <Image src="/logo.webp" alt="Corujinha" width={80} height={80} className="h-16 w-16 object-contain" />
        </div>
        <Suspense fallback={<p className="text-center text-sm text-slate-500">A carregar…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
