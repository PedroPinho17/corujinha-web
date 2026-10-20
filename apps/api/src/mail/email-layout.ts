import { escapeHtml } from "../common/escape-html";

function siteBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

/** Absolute logo URL for HTML emails (PNG — Outlook-safe). */
export function emailLogoUrl() {
  return `${siteBaseUrl()}/logo-email.png`;
}

export type EmailLayoutOpts = {
  title: string;
  preheader?: string;
  bodyHtml: string;
  /** Optional primary CTA */
  cta?: { label: string; href: string };
};

/**
 * Shared Corujinha HTML email shell: logo, content card, branded footer.
 * Solid colours + Arial for maximum client compatibility (Outlook).
 */
export function renderEmailHtml(opts: EmailLayoutOpts): string {
  const logo = escapeHtml(emailLogoUrl());
  const year = new Date().getFullYear();
  const site = escapeHtml(siteBaseUrl());
  const siteHost = site.replace(/^https?:\/\//, "");
  const phone = escapeHtml(process.env.CONTACT_PHONE ?? process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "");
  const email = escapeHtml(process.env.CONTACT_NOTIFY_TO ?? process.env.SMTP_FROM ?? "");
  const privacy = `${site}/privacidade`;
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(opts.preheader)}</div>`
    : "";
  const cta = opts.cta
    ? `<p style="margin:28px 0 8px;text-align:center;">
        <a href="${escapeHtml(opts.cta.href)}"
           style="display:inline-block;background:#db2777;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;">
          ${escapeHtml(opts.cta.label)}
        </a>
      </p>`
    : "";

  const contactLine = [
    phone ? `Tel. ${phone}` : null,
    email ? email : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#fdf2f8;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  ${preheader}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fdf2f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #fce7f3;">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;background:#fdf2f8;">
              <img src="${logo}" alt="Corujinha" width="160" height="72" style="display:inline-block;max-width:160px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 8px;background:#ffffff;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#be185d;font-weight:800;font-family:Arial,Helvetica,sans-serif;">
                ${escapeHtml(opts.title)}
              </h1>
              <div style="font-size:15px;line-height:1.65;color:#374151;font-family:Arial,Helvetica,sans-serif;">
                ${opts.bodyHtml}
              </div>
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 28px;border-top:1px solid #fce7f3;background:#ffffff;">
              <p style="margin:0 0 6px;font-size:13px;color:#6b7280;text-align:center;font-family:Arial,Helvetica,sans-serif;">
                Centro de Apoio Escolar Corujinha
              </p>
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-align:center;font-family:Arial,Helvetica,sans-serif;">
                Lobão · São João de Ver · Sanguedo
              </p>
              ${
                contactLine
                  ? `<p style="margin:0 0 6px;font-size:12px;color:#6b7280;text-align:center;font-family:Arial,Helvetica,sans-serif;">${contactLine}</p>`
                  : ""
              }
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;font-family:Arial,Helvetica,sans-serif;">
                <a href="${site}" style="color:#db2777;text-decoration:none;">${siteHost}</a>
                · <a href="${privacy}" style="color:#db2777;text-decoration:none;">Privacidade</a>
                · © ${year}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
