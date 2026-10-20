# Deploy Coolify — Corujinha

## Padrão recomendado

Um domínio público (ex.: `https://corujinha.pt`):

- `/` → serviço **web** (Next.js)
- `/api/*` → serviço **api** (NestJS) via rewrite interno do Next (`INTERNAL_API_URL`)

Isto mantém cookies Better Auth first-party.

Fluxo de rede: **Cliente → Traefik (TLS) → web → api**. A API deve ver o peer como a rede Docker do Next (`TRUST_PROXY_HOPS=1`). O IP real para rate-limits vem do cabeçalho `x-corujinha-client-ip` (definido pelo middleware Next a partir de `X-Real-IP` do Traefik).

## Variáveis obrigatórias

- `DATABASE_URL`, `REDIS_URL`
- `BETTER_AUTH_SECRET` (≥32 chars)
- `BETTER_AUTH_URL` = URL pública (ex. `https://corujinha.pt`)
- `NEXT_PUBLIC_APP_URL` = mesma URL pública
- `INTERNAL_API_URL` = URL interna do contentor API (ex. `http://api:3001`)
- `TRUST_PROXY_HOPS=1` (API)
- S3 / R2 credentials + `S3_BUCKET` + `S3_PUBLIC_URL` + `S3_CORS_ORIGINS=https://corujinha.pt`
- `DEEPL_API_KEY` (tradução admin)
- `SMTP_*` + `SMTP_FROM` no domínio verificado + `CONTACT_NOTIFY_TO`
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (recomendado)
- `WEBAUTHN_RP_ID` = hostname público (sem protocolo)

## Email (Resend)

1. Verificar domínio no Resend (SPF, DKIM, DMARC).
2. SMTP Resend → `SMTP_HOST` / porta / user / pass.
3. `SMTP_FROM=noreply@corujinha.pt` (domínio verificado).
4. Enviar email de teste pelo fluxo «Esqueci-me da password».

## Backups

Ver secção «Cópias de segurança automáticas» em [`docs/RUNBOOK.md`](../docs/RUNBOOK.md): cron `pg_dump` + sync R2 + drill de restauro.

## Healthcheck

API: `GET /api/health`

## Compose

`docker-compose.prod.yml` — serviços `postgres`, `redis`, `api`, `web`. No Coolify pode mapear o mesmo `.env` e build Dockerfiles em `apps/api` e `apps/web`.
