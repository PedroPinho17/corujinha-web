"use client";

import Link from "next/link";
import { PasskeyManager } from "@/components/admin/passkey-manager";

export default function SecurityPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-[0_20px_27px_rgba(0,0,0,0.05)]">
        <h2 className="text-base font-bold text-slate-800">Passkey / WebAuthn</h2>
        <PasskeyManager />
      </div>

      <p className="text-sm text-slate-500">
        Também podes gerir passkeys em{" "}
        <Link href="/admin/profile" className="font-semibold text-indigo-500 hover:underline">
          Perfil
        </Link>
        .
      </p>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-900">
        <strong>Primeiro login:</strong> utilizadores novos ou migrados com password temporária
        devem mudar a password antes de usar o backoffice. Depois disso, regista a passkey aqui ou
        no Perfil.
      </div>
    </div>
  );
}
