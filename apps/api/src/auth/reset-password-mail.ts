import { escapeHtml } from "../common/escape-html";
import { renderEmailHtml } from "../mail/email-layout";

/** Copy for password-reset emails (formal «você»). */
export function buildResetPasswordMail(name: string, url: string) {
  const safeName = name || "admin";
  return {
    subject: "Recuperar password — Corujinha",
    text: [
      `Olá ${safeName},`,
      "",
      "Recebemos um pedido para redefinir a password do backoffice Corujinha.",
      "Abra este link (válido durante 1 hora):",
      url,
      "",
      "Se não pediu esta alteração, ignore este email.",
      "",
      "— Centro de Apoio Escolar Corujinha",
    ].join("\n"),
    html: renderEmailHtml({
      title: "Recuperar password",
      preheader: "Link para definir uma nova password (válido 1 hora)",
      bodyHtml: `<p>Olá <strong>${escapeHtml(safeName)}</strong>,</p>
<p>Recebemos um pedido para redefinir a password do backoffice Corujinha.</p>
<p>O link é válido durante <strong>1 hora</strong>. Se não pediu esta alteração, pode ignorar este email com segurança.</p>`,
      cta: { label: "Definir nova password", href: url },
    }),
  };
}
