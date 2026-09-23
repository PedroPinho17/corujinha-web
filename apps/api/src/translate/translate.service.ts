import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import * as deepl from "deepl-node";

@Injectable()
export class TranslateService {
  private translator: deepl.Translator | null = null;

  private getTranslator() {
    const key = process.env.DEEPL_API_KEY;
    if (!key) return null;
    if (!this.translator) {
      this.translator = new deepl.Translator(key);
    }
    return this.translator;
  }

  async translate(text: string, targets: string[], sourceCode?: string) {
    if (!text?.trim()) {
      throw new BadRequestException("Texto fonte obrigatório");
    }
    if (!targets?.length) {
      throw new BadRequestException("Indique pelo menos um idioma destino");
    }

    const translator = this.getTranslator();
    if (!translator) {
      throw new ServiceUnavailableException(
        "DeepL não configurado. Defina DEEPL_API_KEY no ambiente.",
      );
    }

    const sourceLang = this.toSourceLang(sourceCode || "pt");
    const translations: Record<string, { texto: string }> = {};

    for (const target of targets) {
      const targetLang = this.toTargetLang(target);
      const result = await translator.translateText(text, sourceLang, targetLang);
      translations[target.toLowerCase()] = { texto: result.text };
    }

    return { success: true as const, translations };
  }

  private toSourceLang(code: string): deepl.SourceLanguageCode | null {
    const c = code.toLowerCase();
    if (c === "pt" || c === "pt-pt" || c === "pt-br") return "pt";
    if (c === "en") return "en";
    if (c === "fr") return "fr";
    if (c === "es") return "es";
    if (c === "de") return "de";
    return "pt";
  }

  private toTargetLang(code: string): deepl.TargetLanguageCode {
    const c = code.toLowerCase();
    if (c === "en" || c === "en-gb") return "en-GB";
    if (c === "en-us") return "en-US";
    if (c === "pt" || c === "pt-pt") return "pt-PT";
    if (c === "pt-br") return "pt-BR";
    if (c === "fr") return "fr";
    if (c === "es") return "es";
    if (c === "de") return "de";
    return "en-GB";
  }
}
