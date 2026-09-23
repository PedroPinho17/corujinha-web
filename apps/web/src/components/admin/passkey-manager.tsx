"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasskeyRow = {
  id: string;
  name?: string | null;
  createdAt?: string;
};

/** Shared passkey register/list/remove block for Perfil and Segurança. */
export function PasskeyManager({ compact = false }: { compact?: boolean }) {
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [name, setName] = useState("Corujinha");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const rows = await apiFetch<PasskeyRow[]>("/api/auth/passkey/list-user-passkeys");
      setPasskeys(Array.isArray(rows) ? rows : []);
    } catch {
      setPasskeys([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function register() {
    setMsg("");
    setLoading(true);
    try {
      const { error } = await authClient.passkey.addPasskey({
        name: name.trim() || "Corujinha",
        authenticatorAttachment: "platform",
      });
      if (error) {
        setMsg(error.message || "Falha ao registar passkey");
        return;
      }
      setMsg("Passkey registada com sucesso");
      await load();
    } catch {
      setMsg("Falha ao registar passkey — usa Chrome/Edge/Safari com biometria ou PIN");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remover esta passkey?")) return;
    setMsg("");
    try {
      await apiFetch("/api/auth/passkey/delete-passkey", {
        method: "POST",
        body: JSON.stringify({ id }),
      });
      setMsg("Passkey removida");
      await load();
    } catch {
      setMsg("Não foi possível remover a passkey");
    }
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <p className="text-sm text-slate-500">
          Regista uma passkey para entrar no backoffice com biometria ou PIN, sem password.
        </p>
      )}

      <div className="max-w-md space-y-3">
        <div>
          <Label htmlFor="passkey-name">Nome da passkey</Label>
          <Input
            id="passkey-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Portátil Pedro"
          />
        </div>
        <Button type="button" onClick={register} disabled={loading}>
          {loading ? "A registar…" : "Adicionar passkey"}
        </Button>
        {msg && (
          <p
            className={`text-sm ${
              msg.includes("sucesso") || msg.includes("removida")
                ? "text-emerald-600"
                : "text-rose-600"
            }`}
          >
            {msg}
          </p>
        )}
      </div>

      <div className={compact ? "mt-2" : "overflow-hidden rounded-xl border border-slate-100"}>
        {!compact && (
          <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <p className="text-sm font-bold text-slate-800">Passkeys registadas</p>
            <p className="text-xs text-slate-400">{passkeys.length} dispositivo(s)</p>
          </div>
        )}
        {passkeys.length === 0 ? (
          <p className={`text-sm text-slate-400 ${compact ? "" : "px-4 py-6 text-center"}`}>
            Ainda não tens passkeys registadas.
          </p>
        ) : (
          <ul className={compact ? "space-y-2" : "divide-y divide-slate-100"}>
            {passkeys.map((p) => (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-3 ${
                  compact ? "rounded-lg bg-slate-50 px-3 py-2" : "px-4 py-3"
                }`}
              >
                <div>
                  <p className="font-semibold text-slate-800">{p.name || "Passkey"}</p>
                  {p.createdAt && (
                    <p className="text-xs text-slate-400">
                      {new Date(p.createdAt).toLocaleString("pt-PT")}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="text-xs font-bold text-rose-500 hover:underline"
                  onClick={() => remove(p.id)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
