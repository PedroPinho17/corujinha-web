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

## Traefik / HTTPS / HSTS

- Só o Traefik deve expor 80/443. **Não** publicar `3000`/`3001` no host.
- Ativar HSTS no edge (ex. Coolify / Traefik middleware): `stsSeconds=31536000`, incluir subdomínios.
- Confirmar nos logs da API que o IP do rate-limit é o do visitante (`x-corujinha-client-ip`), não o do contentor Traefik.

## Redis

O Redis vem de `docker-compose.yml` (AOF + volume `redis_data`), referenciado por `docker-compose.prod.yml` (`depends_on: redis`, `REDIS_HOST=redis`). Se criar o Redis à parte no Coolify: `--appendonly yes` + volume persistente + `REDIS_URL`.

## Healthcheck

API: `GET /api/health`

## Compose

`docker-compose.yml` + `docker-compose.prod.yml` — `postgres`, `redis`, `api`, `web`. No Coolify mapear o `.env` e os Dockerfiles em `apps/api` e `apps/web`.
