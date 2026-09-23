"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/admin-api";
import { authClient } from "@/lib/auth-client";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("A password deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As passwords não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await adminFetch("/api/me/change-password", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      // Hard navigation: layout re-checks /api/me (DB), not the stale session cookie
      await authClient.getSession({ query: { disableCookieCache: true } }).catch(() => null);
      window.location.href = "/admin";
    } catch {
      setError("Não foi possível alterar a password");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-lg"
      >
        <h1 className="text-2xl font-bold text-slate-800">Alterar password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Por segurança, defina uma nova password para continuar.
        </p>
        <div className="mt-6 space-y-3">
          <div>
            <Label htmlFor="password">Nova password</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="confirm">Confirmar password</Label>
            <Input
              id="confirm"
              type="password"
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A guardar…" : "Guardar e continuar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
