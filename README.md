# corujinha-web

Portal e CMS da **Corujinha** — centro de apoio escolar / explicações.

Monorepo **Next.js 15** + **NestJS** + PostgreSQL + Prisma + Redis + BullMQ + S3/R2 + Better Auth (passkeys) + shadcn/ui + Docker/Coolify + Sentry.

---

## Estrutura

```
apps/web/           Next.js 15 — site público + /admin
apps/api/           NestJS — Better Auth, CMS API, BullMQ, S3, RGPD
packages/database/  Prisma schema + migrations + seed
packages/shared/    tipos + DEFAULT_SITE_CONTENT
docker/             entrypoints + COOLIFY.md
e2e/                Playwright (smoke, CSP, acessibilidade)
docs/               RUNBOOK (go-live, backups, RGPD)
```

---

## Arranque local

```bash
cp .env.example .env          # preencher ADMIN_PASSWORD (≥12) e BETTER_AUTH_SECRET (≥32)
pnpm install
pnpm docker:up                # Postgres, Redis, Garage (S3), Mailpit
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm --filter @corujinha/shared build
pnpm migrate:legacy           # opcional: MySQL Laravel + imagens → Postgres/S3
pnpm dev
```

| Serviço | URL |
|---------|-----|
| Site | http://localhost:3000 |
| Admin | http://localhost:3000/admin/login |
| API health | http://localhost:3001/api/health |
| Mailpit | http://localhost:8026 |
| Garage (S3 local) | http://127.0.0.1:3900 · media :3902 |

Seed admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` no `.env` (o seed força `mustChangePassword`).

Variáveis úteis (ver `.env.example`):

| Variável | Notas |
|----------|--------|
| `REVALIDATE_SECRET` | Mesmo valor em web + api (cache Next) |
| `ALLOW_SEARCH_INDEXING` | `false` local/staging; `true` só em produção |
| `CONTACT_RETENTION_MONTHS` | Default `24` — anonimização RGPD + texto em `/privacidade` |
| `CONTACT_NOTIFY_TO` | Destino dos avisos de contacto |

---

## Feature map

| Área | Notas |
|------|--------|
| Auth | Better Auth no Nest (`/api/auth`), passkeys, `mustChangePassword`, rate limit de login |
| Roles | `ADMIN` \| `EDITOR` — só ADMIN gere utilizadores |
| Público | `/`, `/about`, `/galeria`, `/equipa`, `/noticias`, `/privacidade`, contacto |
| Admin | CRUDs CMS + conteúdo do site + contactos + perfil + segurança |
| Media | Presign S3/R2 (local: Garage), limite 10 MB, `size` assinado |
| Contacto | Honeypot + consentimento + limites IP/email → BullMQ → SMTP + confirmação |
| Cache | Redis (~30 min) + `revalidateTag` via `/api/revalidate` |
| RGPD | Export/erase no backoffice; anonimização automática após N meses |
| Sentry | Opcional: `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` |

---

## Testes

### Unitários (API)

```bash
pnpm test                 # Vitest + coverage (apps/api)
pnpm typecheck
pnpm lint
```

### E2E (Playwright)

Com a stack a correr (`pnpm dev` ou compose):

```bash
pnpm exec playwright install chromium   # uma vez
pnpm test:e2e
```

Cobertura em `e2e/`:

| Suite | O quê |
|-------|--------|
| `smoke` | Home, robots/sitemap, login admin |
| `csp` | Nonce / políticas + erros CSP em `/`, `/galeria`, `/equipa`, `/noticias` |
| `a11y` | axe (WCAG) nas páginas públicas + admin após login |

Variáveis opcionais: `E2E_BASE_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.

### CI (GitHub Actions)

Jobs obrigatórios em `main`: **audit** · **test** · **docker** · **compose-smoke**.

O `compose-smoke` sobe o stack Docker, faz smoke de API/media/web e corre Playwright.

### Produção

```bash
pnpm verify:production -- https://SEU_DOMINIO
# VERIFY_HOST=IP_VPS pnpm verify:production -- https://SEU_DOMINIO
```

---

## Deploy (Coolify)

Guia completo: **[docker/COOLIFY.md](docker/COOLIFY.md)** · checklist: **[docs/RUNBOOK.md](docs/RUNBOOK.md)**.

Resumo:

- Um domínio: `/` → **web**, `/api/*` → **api** (cookies first-party)
- Traefik TLS + HSTS; **não** publicar `3000`/`3001` no host
- Produção: `ALLOW_SEARCH_INDEXING=true`, `REVALIDATE_SECRET` forte (igual em web e api)
- Email: Resend (SPF, DKIM, DMARC) · storage: Cloudflare R2
- Backups: `pg_dump` + drill de restauro (ver RUNBOOK)

---

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Web + API em desenvolvimento |
| `pnpm build` | Build monorepo (Turbo) |
| `pnpm docker:up` / `docker:down` | Infra local |
| `pnpm db:studio` | Prisma Studio |
| `pnpm generate:favicons` | Favicons a partir do logo |

---

## Licença / uso

Repositório privado do projeto Corujinha.
