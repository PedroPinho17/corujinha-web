"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin-api";

type TranslateResult = {
  success: boolean;
  translations: Record<string, { texto: string }>;
  message?: string;
};

/**
 * DeepL helper — parity with Laravel auto-translate-common.js
 */
export function DeepLTranslateButton({
  getSourceText,
  onTranslated,
  targets = ["en", "fr", "es"],
  sourceCode = "pt",
}: {
  getSourceText: () => string;
  onTranslated: (translations: Record<string, string>) => void;
  targets?: string[];
  sourceCode?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const run = useCallback(async () => {
    const text = getSourceText().trim();
    if (!text) {
      setMsg("Preencha o campo em Português antes de traduzir.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const data = await adminFetch<TranslateResult>("/api/admin/translate", {
        method: "POST",
        body: JSON.stringify({ text, targets, source_code: sourceCode }),
      });
      if (!data.success) {
        setMsg(data.message || "Falha na tradução");
        return;
      }
      const mapped: Record<string, string> = {};
      Object.entries(data.translations || {}).forEach(([code, obj]) => {
        mapped[code] = obj.texto;
      });
      onTranslated(mapped);
      setMsg(`Traduções aplicadas (${Object.keys(mapped).length})`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro DeepL");
    } finally {
      setLoading(false);
    }
  }, [getSourceText, onTranslated, targets, sourceCode]);

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={run}>
        {loading ? "A traduzir..." : "Traduzir (armazenar, não publicado)"}
      </Button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  );
}
