"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasskeyManager } from "@/components/admin/passkey-manager";
import { adminFetch } from "@/lib/admin-api";
import { authClient } from "@/lib/auth-client";

type Me = {
  id: string;
  email: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
};

export default function AdminProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    adminFetch<{ user: Me }>("/api/me")
      .then((r) => {
        setMe(r.user);
        setName(r.user.name);
      })
      .catch(console.error);
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      const r = await adminFetch<{ user: Me }>("/api/me", {
        method: "PUT",
        body: JSON.stringify({ name }),
      });
      setMe(r.user);
      setMsg("Perfil atualizado");
    } catch {
      setMsg("Erro ao atualizar perfil");
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    try {
      await adminFetch("/api/me/change-password", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      await authClient.getSession({ query: { disableCookieCache: true } });
      setMsg("Password atualizada");
    } catch {
      setMsg("Erro ao alterar password");
    }
  }

  if (!me) {
    return <p className="text-center text-sm text-slate-400">A carregar…</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      {msg && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{msg}</p>
      )}

      <form
        onSubmit={saveProfile}
        className="space-y-3 rounded-2xl bg-white p-5 shadow-[0_20px_27px_rgba(0,0,0,0.05)]"
      >
        <h2 className="text-base font-bold text-slate-800">Dados pessoais</h2>
        <div>
          <Label>Email</Label>
          <Input value={me.email} disabled />
        </div>
        <div>
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <p className="text-xs text-slate-400">Permissão: {me.role}</p>
        <Button type="submit">Guardar perfil</Button>
      </form>

      <form
        onSubmit={savePassword}
        className="space-y-3 rounded-2xl bg-white p-5 shadow-[0_20px_27px_rgba(0,0,0,0.05)]"
      >
        <h2 className="text-base font-bold text-slate-800">Alterar password</h2>
        <div>
          <Label>Nova password</Label>
          <Input
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit">Atualizar password</Button>
      </form>

      <div className="rounded-2xl bg-white p-5 shadow-[0_20px_27px_rgba(0,0,0,0.05)]">
        <h2 className="text-base font-bold text-slate-800">Passkey</h2>
        <p className="mt-1 text-sm text-slate-500">
          Entra no backoffice com biometria ou PIN — sem password no login.
        </p>
        <div className="mt-4">
          <PasskeyManager compact />
        </div>
      </div>
    </div>
  );
}
