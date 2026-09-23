"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminFetch } from "@/lib/admin-api";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
};

export default function AdminUsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setRows(await adminFetch<User[]>("/api/admin/users"));
  }

  useEffect(() => {
    load().catch((e) => setError(String(e)));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await adminFetch("/api/admin/users", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role: "EDITOR", mustChangePassword: true }),
    });
    setName("");
    setEmail("");
    setPassword("");
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Apagar utilizador?")) return;
    await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-sky-deep">Utilizadores</h1>
      {error && <p className="mt-2 text-sm text-coral">{error}</p>}
      <form onSubmit={create} className="mt-8 max-w-xl space-y-3 rounded-2xl bg-white p-5 ring-1 ring-ink/5">
        <div>
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>Password inicial</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <Button type="submit">Criar EDITOR</Button>
      </form>
      <ul className="mt-8 space-y-2">
        {rows.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-ink/5"
          >
            <div>
              <p className="font-medium">
                {u.name} · {u.email}
              </p>
              <p className="text-xs text-muted">
                {u.role}
                {u.mustChangePassword ? " · deve mudar password" : ""}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => remove(u.id)}>
              Apagar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
