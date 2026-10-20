# RUNBOOK — Corujinha

## Ambientes

| | Local | Produção (Coolify / VPS) |
|--|--|--|
| Postgres | `127.0.0.1:5434` | serviço `postgres` |
| Redis | `127.0.0.1:6381` | serviço `redis` |
| Object storage | Garage (perfil `local`) | Cloudflare R2 (recomendado) |
| SMTP | Mailpit `:1026` / UI `:8026` | Resend (ou SMTP real) |
| App | `pnpm dev` — web `:3000`, API `:3001` | compose prod / Coolify |

## Arranque local

1. `cp .env.example .env` e preencher `ADMIN_PASSWORD` (≥12), `BETTER_AUTH_SECRET` (≥32).
2. Gerar chaves Garage: `S3_ACCESS_KEY=GK` + `openssl rand -hex 15`; `S3_SECRET_KEY` e `GARAGE_RPC_SECRET` com `openssl rand -hex 32`.
3. `pnpm docker:up` (perfil `local`: Garage + Mailpit + Postgres + Redis).
4. `pnpm install && pnpm db:generate && pnpm db:deploy && pnpm db:seed`
5. `pnpm dev` — health: `http://localhost:3001/api/health`

## Checklist de go-live (produção)

### 1. Domínio e HTTPS

1. Apontar o DNS (A/AAAA ou CNAME) para o VPS / Coolify.
2. No Coolify, associar o domínio ao serviço **web** com TLS (Traefik / Let's Encrypt).
3. Confirmar `https://SEU_DOMINIO` e redirecionamento HTTP→HTTPS.
4. Definir:
   - `NEXT_PUBLIC_APP_URL=https://SEU_DOMINIO`
   - `BETTER_AUTH_URL=https://SEU_DOMINIO`
   - `WEBAUTHN_RP_ID=SEU_DOMINIO` (hostname sem protocolo)
   - `INTERNAL_API_URL=http://api:3001` (rede Docker interna)
5. Proxy: Traefik → Next → API (rewrites). Definir `TRUST_PROXY_HOPS=1` na API (peer imediato = contentor web). O Next envia `x-corujinha-client-ip` a partir de `X-Real-IP` do Traefik — **não** confiar em `X-Forwarded-For` inventado pelo browser.
6. **Não** publicar as portas `3000`/`3001` no host — só `expose` na rede Docker; o Traefik é a única entrada.
7. HSTS: ativar no Traefik/Coolify (middleware `headers.stsSeconds=31536000`, `stsIncludeSubdomains=true`). A app Next não envia HSTS (fica no edge).
8. Redis: o serviço está em `docker-compose.yml` com `--appendonly yes` e volume `redis_data`. No Coolify, confirme o mesmo volume + AOF se o Redis for um serviço à parte.
9. Indexação: por omissão `ALLOW_SEARCH_INDEXING` está off — `/robots.txt` responde `Disallow: /` e o sitemap fica vazio. No go-live, no Coolify: `ALLOW_SEARCH_INDEXING=true` (sem rebuild, a rota é dinâmica).

### 2. Email (Resend + DNS)

1. Criar domínio no Resend (ou outro SMTP).
2. Publicar registos DNS: **SPF**, **DKIM**, **DMARC** e aguardar validação.
3. Variáveis:
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` (credenciais Resend SMTP)
   - `SMTP_FROM=noreply@SEU_DOMINIO` (domínio verificado — nunca `@corujinha.local`)
   - `CONTACT_NOTIFY_TO=equipa@SEU_DOMINIO`
4. Testar: recuperar password, inscrição e mensagem de contacto (equipa + confirmação à família).
5. Confirmar que o logótipo (`/logo-email.png`) carrega no Outlook/Gmail.

### 3. Object storage (R2)

1. Bucket R2 privado + URL pública HTTPS (`S3_PUBLIC_URL` / `NEXT_PUBLIC_S3_PUBLIC_URL`).
2. CORS do bucket: origem = domínio do site (nunca `*`).
3. Chaves: `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` (se aplicável), `S3_FORCE_PATH_STYLE`.
4. Testar upload no backoffice (galeria / conteúdo do site) e visualização no site.

### 4. Cópias de segurança automáticas

Cron diário no VPS (exemplo):

```bash
# /etc/cron.d/corujinha-backup
0 3 * * * root /usr/local/bin/corujinha-backup.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d)
DIR=/var/backups/corujinha/$STAMP
mkdir -p "$DIR"
docker exec corujinha-postgres pg_dump -U "$POSTGRES_USER" -Fc --no-owner --no-acl "$POSTGRES_DB" > "$DIR/db.dump"
# Sync R2 (exemplo com rclone remoto "r2:corujinha-media")
rclone sync r2:corujinha-media "$DIR/media" --checksum
find /var/backups/corujinha -maxdepth 1 -mtime +14 -type d -exec rm -rf {} +
```

**Teste de restauro** (trimestral): restaurar `db.dump` numa base temporária + verificar 3 objectos do R2. Documentar data do último drill.

### 5. Observabilidade

- `SENTRY_DSN` (API) e `NEXT_PUBLIC_SENTRY_DSN` (web).
- Health: `GET /api/health` no Coolify.

## Media (Garage / R2)

- Upload: admin → presign → `PUT` com o mesmo `Content-Type` assinado.
- Em produção use R2 (ou S3 compatível) com `S3_PUBLIC_URL` HTTPS e `S3_CORS_ORIGINS` listando o domínio do site (nunca `*`).
- Pastas permitidas: `uploads`, `gallery`, `posts`, `teams`, `protocols`, `branding`, `site`.
- MIME: imagens JPEG/PNG/WEBP; PDF só em `protocols`.
- Local: URL pública Garage website `http://corujinha-media.web.garage.localhost:3902/<key>`.

## Auth

- Registo público desactivado (`disableSignUp`).
- Contas só via seed / `POST /api/admin/users` (ADMIN).
- Seed marca `mustChangePassword: true` — o backoffice bloqueia até trocar a password.
- Password mínima: 12 caracteres.
- Limite de login: 5 **falhas** / 15 min por IP (Redis `rl:auth`). Trocar `X-Forwarded-For` não contorna o limite.

## Contacto e email

- `POST /api/public/contact` — honeypot `website`, consentimento RGPD, rate limit 5/15min (Redis).
- `CONTACT_NOTIFY_TO` e SMTP obrigatórios em produção (`assertProductionEnv`).
- `SMTP_SECURE=true|false` opcional; por omissão secure só na porta 465.

## Backups manuais

```bash
pg_dump "$DATABASE_URL" -Fc --no-owner --no-acl -f backups/corujinha.dump
pg_restore -d "$DATABASE_URL" --clean --if-exists --no-owner --no-acl backups/corujinha.dump
```

Sincronizar object storage (R2/Garage) à parte (ver cron acima).

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

## Testes e2e (Playwright)

Com a stack a correr (`pnpm dev` ou compose):

```bash
pnpm exec playwright install chromium   # uma vez
pnpm test:e2e
# ou: E2E_BASE_URL=https://staging.exemplo pnpm test:e2e
```

No CI, o job `compose-smoke` corre estes testes contra `http://127.0.0.1:3000` depois do stack estar up.

## Incidentes

| Sintoma | Checklist |
|---------|-----------|
| API não arranca em prod | `BETTER_AUTH_SECRET`, `S3_*`, `CONTACT_NOTIFY_TO`, SMTP; logs `assertProductionEnv` |
| Upload 403 SignatureDoesNotMatch | Content-Type no PUT = tipo do presign; checksum Garage `WHEN_REQUIRED` |
| Contacto sem email | Redis/BullMQ a correr; `CONTACT_NOTIFY_TO`; Mailpit/SMTP |
| Login ok mas backoffice 403 | `mustChangePassword` → `/admin/change-password` |
| Rate limit contornável | Confirmar Traefik `X-Real-IP`, Next middleware, `TRUST_PROXY_HOPS`, Redis partilhado |
| Emails sem logo no Outlook | Servir `/logo-email.png` (não WebP) no domínio público |
