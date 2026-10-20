"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/admin-api";

type UserRole = "ADMIN" | "EDITOR";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  mustChangePassword: boolean;
};

type Me = { id: string; role: string };

export default function AdminUsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("EDITOR");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [users, session] = await Promise.all([
      adminFetch<User[]>("/api/admin/users"),
      adminFetch<{ user: Me }>("/api/me"),
    ]);
    setRows(users);
    setMe(session.user);
  }

  useEffect(() => {
    load().catch((e) => setError(String(e)));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await adminFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          mustChangePassword: true,
        }),
      });
      setName("");
      setEmail("");
      setPassword("");
      setRole("EDITOR");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar utilizador");
    } finally {
      setSaving(false);
    }
  }

  async function setUserRole(id: string, nextRole: UserRole) {
    const user = rows.find((r) => r.id === id);
    if (!user) return;
    setError("");
    try {
      await adminFetch(`/api/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: nextRole,
          mustChangePassword: user.mustChangePassword,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar papel");
      await load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Apagar utilizador?")) return;
    setError("");
    try {
      await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao apagar");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Utilizadores</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cria editores ou administradores do backoffice. A password inicial deve ter pelo menos 12
          caracteres.
        </p>
      </div>
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={create}
        className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
      >
        <h2 className="text-base font-semibold text-slate-800">Novo utilizador</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="user-name">Nome</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="user-password">Password inicial</Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={12}
              required
            />
          </div>
          <div>
            <Label htmlFor="role">Papel</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
            >
              <option value="EDITOR">Editor — gere conteúdo</option>
              <option value="ADMIN">Admin — acesso total (utilizadores)</option>
            </select>
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "A criar…" : role === "ADMIN" ? "Criar administrador" : "Criar editor"}
        </Button>
      </form>

      <ul className="space-y-2">
        {rows.map((u) => {
          const isSelf = me?.id === u.id;
          return (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900">
                  {u.name} · <span className="font-normal text-slate-600">{u.email}</span>
                  {isSelf ? (
                    <span className="ml-2 text-xs font-semibold text-pink-600">(você)</span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {u.mustChangePassword ? "Deve mudar a password no próximo login · " : null}
                  Papel atual: <strong>{u.role}</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={`Papel de ${u.name}`}
                  value={u.role === "ADMIN" ? "ADMIN" : "EDITOR"}
                  onChange={(e) => void setUserRole(u.id, e.target.value as UserRole)}
                  className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus:border-pink-400"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {!isSelf ? (
                  <Button size="sm" variant="outline" onClick={() => void remove(u.id)}>
                    Apagar
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
