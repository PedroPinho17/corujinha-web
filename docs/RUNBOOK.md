# RUNBOOK — Corujinha

## Ambientes

| | Local | Produção (Coolify / VPS) |
|--|--|--|
| Postgres | `127.0.0.1:5434` | serviço `postgres` |
| Redis | `127.0.0.1:6381` | serviço `redis` |
| Object storage | Garage (perfil `local`) | Cloudflare R2 (recomendado) |
| SMTP | Mailpit `:1026` / UI `:8026` | SMTP real do cliente |
| App | `pnpm dev` — web `:3000`, API `:3001` | compose prod / Coolify |

## Arranque local

1. `cp .env.example .env` e preencher `ADMIN_PASSWORD` (≥12), `BETTER_AUTH_SECRET` (≥32).
2. Gerar chaves Garage: `S3_ACCESS_KEY=GK` + `openssl rand -hex 15`; `S3_SECRET_KEY` e `GARAGE_RPC_SECRET` com `openssl rand -hex 32`.
3. `pnpm docker:up` (perfil `local`: Garage + Mailpit + Postgres + Redis).
4. `pnpm install && pnpm db:generate && pnpm db:deploy && pnpm db:seed`
5. `pnpm dev` — health: `http://localhost:3001/api/health`

## Media (Garage / R2)

- Upload: admin → presign → `PUT` com o mesmo `Content-Type` assinado.
- Em produção use R2 (ou S3 compatível) com `S3_PUBLIC_URL` HTTPS e `S3_CORS_ORIGINS` listando o domínio do site (nunca `*`).
- Pastas permitidas: `uploads`, `gallery`, `posts`, `teams`, `protocols`, `branding`.
- MIME: imagens JPEG/PNG/WEBP; PDF só em `protocols`.
- Local: URL pública Garage website `http://corujinha-media.web.garage.localhost:3902/<key>`.

## Auth

- Registo público desactivado (`disableSignUp`).
- Contas só via seed / `POST /api/admin/users` (ADMIN).
- Seed marca `mustChangePassword: true` — o backoffice bloqueia até trocar a password.
- Password mínima: 12 caracteres.

## Contacto e email

- `POST /api/public/contact` — honeypot `website`, consentimento RGPD, rate limit 5/15min.
- `CONTACT_NOTIFY_TO` e SMTP obrigatórios em produção (`assertProductionEnv`).
- `SMTP_SECURE=true|false` opcional; por omissão secure só na porta 465.

## Backups

```bash
pg_dump "$DATABASE_URL" -Fc --no-owner --no-acl -f backups/corujinha.dump
pg_restore -d "$DATABASE_URL" --clean --if-exists --no-owner --no-acl backups/corujinha.dump
```

Sincronizar object storage (R2/Garage) à parte.

## RGPD

- Página pública: `/privacidade`
- Consentimento no formulário de contacto
- Backoffice: export JSON e erase (anonimização) por contacto
- Conservação típica: até 24 meses ou pedido de apagamento

## Protecção do `main`

Ruleset / branch protection no GitHub:

- PR obrigatório antes de merge
- Checks obrigatórios: `audit`, `test`, `docker`, `compose-smoke`
- Sem force-push; sem delete da branch `main`
- Settings: https://github.com/PedroPinho17/corujinha-web/settings/rules

## Incidentes

| Sintoma | Checklist |
|---------|-----------|
| API não arranca em prod | `BETTER_AUTH_SECRET`, `S3_*`, `CONTACT_NOTIFY_TO`, SMTP; logs `assertProductionEnv` |
| Upload 403 SignatureDoesNotMatch | Content-Type no PUT = tipo do presign; checksum Garage `WHEN_REQUIRED` |
| Contacto sem email | Redis/BullMQ a correr; `CONTACT_NOTIFY_TO`; Mailpit/SMTP |
| Login ok mas backoffice 403 | `mustChangePassword` → `/admin/change-password` |
