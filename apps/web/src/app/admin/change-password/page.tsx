"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const mustChange = Boolean(
    (session?.user as { mustChangePassword?: boolean } | undefined)?.mustChangePassword,
  );

  useEffect(() => {
    if (!isPending && !session && !done) {
      router.replace("/admin/login");
    }
  }, [isPending, session, router, done]);

  useEffect(() => {
    if (!isPending && session && !mustChange && !done) {
      router.replace("/admin");
    }
  }, [isPending, session, mustChange, router, done]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("currentPassword"));
    const newPassword = String(form.get("newPassword"));
    const confirm = String(form.get("confirm"));
    if (newPassword !== confirm) {
      setLoading(false);
      setError("As passwords novas não coincidem.");
      return;
    }
    if (newPassword.length < 12) {
      setLoading(false);
      setError("A nova password deve ter pelo menos 12 caracteres.");
      return;
    }
    if (newPassword === currentPassword) {
      setLoading(false);
      setError("A nova password não pode ser igual à password actual.");
      return;
    }
    try {
      const res = await fetch("/api/admin/me/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.message;
        throw new Error(
          typeof msg === "string"
            ? msg
            : Array.isArray(msg)
              ? msg.join(", ")
              : "Não foi possível alterar a password.",
        );
      }
      await authClient.signOut();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-100 bg-white p-7 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-slate-800">Password alterada</h1>
          <p className="text-sm text-slate-500">Inicia sessão com a nova password.</p>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              router.replace("/admin/login");
              router.refresh();
            }}
          >
            Ir para o login
          </Button>
        </div>
      </div>
    );
  }

  if (isPending || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] text-slate-500">
        A carregar...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-xl border border-slate-100 bg-white p-7 shadow-lg"
      >
        <h1 className="text-2xl font-bold text-slate-800">Alterar password</h1>
        <p className="text-sm text-slate-500">
          A conta foi criada com uma password temporária. Define uma nova antes de
          continuar. Depois terás de iniciar sessão com a nova password.
        </p>
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Password actual</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            minLength={12}
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nova password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar nova password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "A guardar..." : "Guardar e entrar"}
        </Button>
      </form>
    </div>
  );
}
