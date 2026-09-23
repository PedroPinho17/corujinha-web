export type UserRole = "ADMIN" | "EDITOR";
export type ContactStatus = "NEW" | "SENT" | "FAILED";
export type ContactKind = "GENERAL" | "ENROLLMENT";

/** Stored translations exist for CMS parity; public site is Portuguese only. */
export const LOCALE_CODES = ["pt"] as const;
export type LocaleCode = (typeof LOCALE_CODES)[number];

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
  kind?: ContactKind;
  subject?: string;
  schoolYear?: string;
  location?: string;
}

export interface TranslateRequest {
  text: string;
  targets: string[];
  source_code?: string;
}

export interface TranslateResult {
  success: boolean;
  translations: Record<string, { texto: string }>;
  message?: string;
}

export * from "./site-content";
