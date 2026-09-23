# Deploy Coolify — Corujinha

## Padrão recomendado

Um domínio público (ex.: `https://corujinha.pt`):

- `/` → serviço **web** (Next.js)
- `/api/*` → serviço **api** (NestJS)

Isto mantém cookies Better Auth first-party (igual VH Team Fighters).

## Variáveis obrigatórias

- `DATABASE_URL`, `REDIS_URL`
- `BETTER_AUTH_SECRET` (≥32 chars)
- `BETTER_AUTH_URL` = URL pública (ex. `https://corujinha.pt`)
- `NEXT_PUBLIC_APP_URL` = mesma URL pública
- `INTERNAL_API_URL` = URL interna do contentor API (ex. `http://api:3001`)
- S3 / MinIO credentials + `S3_BUCKET`
- `DEEPL_API_KEY` (tradução admin)
- `SMTP_*` + `CONTACT_NOTIFY_TO`
- `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (opcional)
- `WEBAUTHN_RP_ID` = hostname público (sem protocolo)

## Healthcheck

API: `GET /api/health`
