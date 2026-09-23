"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/admin-api";
import type { ContactContent } from "@/lib/site-content";

type Mode = "ENROLLMENT" | "GENERAL";

export function ContactForm({
  contact,
  defaultMode = "ENROLLMENT",
}: {
  contact: Pick<ContactContent, "locations" | "subjects" | "schoolYears">;
  defaultMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [loading, setLoading] = useState(false);
  const [okMessage, setOkMessage] = useState("Mensagem enviada!");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const subject = String(fd.get("subject") || "");
    const schoolYear = String(fd.get("schoolYear") || "");
    const location = String(fd.get("location") || "");
    const freeMessage = String(fd.get("message") || "").trim();

    const message =
      mode === "ENROLLMENT"
        ? [
            freeMessage || "Pedido de inscrição via site.",
            subject && `Disciplina: ${subject}`,
            schoolYear && `Ano: ${schoolYear}`,
            location && `Polo: ${location}`,
          ]
            .filter(Boolean)
            .join("\n")
        : freeMessage;

    try {
      const res = await apiFetch<{ message?: string }>("/api/public/contact", {
        method: "POST",
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone") || undefined,
          message,
          kind: mode,
          subject: mode === "ENROLLMENT" ? subject || undefined : undefined,
          schoolYear: mode === "ENROLLMENT" ? schoolYear || undefined : undefined,
          location: mode === "ENROLLMENT" ? location || undefined : undefined,
        }),
      });
      setOkMessage(res.message || "Enviado com sucesso!");
      setStatus("ok");
      e.currentTarget.reset();
    } catch {
      setStatus("err");
    } finally {
      setLoading(false);
    }
  }

  if (status === "ok") {
    return (
      <div className="py-10 text-center" role="status">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl text-green-600">
          ✓
        </div>
        <h4 className="font-display text-2xl font-bold">{okMessage}</h4>
        <p className="mt-2 text-muted">Entraremos em contacto em breve.</p>
        <Button type="button" className="mt-6" variant="secondary" onClick={() => setStatus("idle")}>
          Enviar outra
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <div
        className="grid grid-cols-2 gap-1 rounded-xl bg-white/70 p-1 ring-1 ring-ink/10"
        role="tablist"
        aria-label="Tipo de pedido"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "ENROLLMENT"}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            mode === "ENROLLMENT" ? "bg-pink text-white shadow" : "text-ink/70 hover:bg-white"
          }`}
          onClick={() => setMode("ENROLLMENT")}
        >
          Pedir inscrição
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "GENERAL"}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            mode === "GENERAL" ? "bg-pink text-white shadow" : "text-ink/70 hover:bg-white"
          }`}
          onClick={() => setMode("GENERAL")}
        >
          Mensagem
        </button>
      </div>

      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" />
      </div>

      {mode === "ENROLLMENT" && (
        <>
          <div>
            <Label htmlFor="subject">Disciplina</Label>
            <select
              id="subject"
              name="subject"
              required
              className="flex h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm"
            >
              <option value="">Selecionar…</option>
              {contact.subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="schoolYear">Ano de escolaridade</Label>
            <select
              id="schoolYear"
              name="schoolYear"
              required
              className="flex h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm"
            >
              <option value="">Selecionar…</option>
              {contact.schoolYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="location">Polo preferido</Label>
            <select
              id="location"
              name="location"
              required
              className="flex h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm"
            >
              <option value="">Selecionar…</option>
              {contact.locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="message">{mode === "ENROLLMENT" ? "Notas (opcional)" : "Mensagem"}</Label>
        <Textarea
          id="message"
          name="message"
          required={mode === "GENERAL"}
          placeholder={
            mode === "ENROLLMENT"
              ? "Horário preferido, disponibilidade, dúvidas…"
              : "Como podemos ajudar?"
          }
          minLength={mode === "GENERAL" ? 5 : undefined}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "A enviar..." : mode === "ENROLLMENT" ? "Pedir inscrição" : "Enviar mensagem"}
      </Button>
      {status === "err" && (
        <p className="text-sm text-orange" role="alert">
          Erro ao enviar. Tente novamente.
        </p>
      )}
    </form>
  );
}
