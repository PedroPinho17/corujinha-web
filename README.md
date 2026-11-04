# corujinha-web

Portal e CMS da **Corujinha**, centro de apoio escolar e explicações.

Monorepo com **Next.js 15**, **NestJS**, **PostgreSQL**, **TypeORM**, Redis, BullMQ, S3/R2, Better Auth (passkeys), Tailwind/shadcn/ui, Docker/Coolify e Sentry.

---

## Estrutura

```
apps/web/           Next.js 15: site público + /admin
apps/api/           NestJS: Better Auth, API do CMS, BullMQ, S3, RGPD
packages/database/  TypeORM: entidades, migrations e seed
packages/shared/    tipos + DEFAULT_SITE_CONTENT
docker/             entrypoints + COOLIFY.md
e2e/                Playwright: smoke, CSP, acessibilidade e responsive
docs/               RUNBOOK: go-live, backups, RGPD
```

---

## Arranque local

Requisitos: Node 22, pnpm 9, Docker e PostgreSQL local na porta 5432.

**Onde corre cada serviço em desenvolvimento:**

| Serviço | Onde | Porta |
|---------|------|-------|
| PostgreSQL | Instalado localmente | 5432 |
| Redis | Docker | 6381 |
| Garage (S3) | Docker | 3900 · media 3902 |
| Mailpit | Docker | SMTP 1026 · UI 8026 |

**1. Configurar o ambiente**

```bash
cp .env.example .env
```

No `.env`, preencher `ADMIN_PASSWORD` (≥ 12), `BETTER_AUTH_SECRET` (≥ 32) e as chaves do Garage (ver [docs/RUNBOOK.md](docs/RUNBOOK.md)).

**2. Criar a base de dados**

```bash
psql -U postgres -c "CREATE ROLE corujinha LOGIN PASSWORD 'corujinha'"
psql -U postgres -c "CREATE DATABASE corujinha OWNER corujinha"
```

Os valores têm de coincidir com o `DATABASE_URL` do `.env`.

**3. Instalar e arrancar**

```bash
pnpm install
pnpm docker:up                          # Redis, Garage e Mailpit
pnpm --filter @corujinha/shared build
pnpm --filter @corujinha/database build
pnpm db:deploy                          # migrations
pnpm db:seed                            # conta admin e conteúdo inicial
pnpm dev
```

| Serviço | URL |
|---------|-----|
| Site | http://localhost:3000 |
| Backoffice | http://localhost:3000/admin/login |
| API health | http://localhost:3001/api/health |
| Mailpit | http://localhost:8026 |

A conta inicial usa `ADMIN_EMAIL` / `ADMIN_PASSWORD`, e o seed obriga a mudar a password no primeiro login.

**Opcional:** `pnpm migrate:legacy` importa dados do MySQL antigo (Laravel) e `pnpm sync:legacy-media` copia as imagens.

### Notas de desenvolvimento

- **`.env` único:** a web e a API leem o `.env` da raiz. Variáveis já definidas no ambiente (Docker, CI) têm prioridade.
- **Primeira visita lenta:** o `pnpm dev` compila cada página na primeira visita. Em produção, isto não acontece.
- **Imagens em tamanho original:** o Node não resolve `*.garage.localhost`, por isso a otimização de imagens fica desligada em local. Com um domínio de media real, fica ligada.
- **Recuperar password:** o email chega ao Mailpit. O limite é de 3 pedidos por hora por IP.
- **Tentativas de login:** 5 falhas bloqueiam o IP durante 15 minutos.

### Variáveis principais

Lista completa em `.env.example`.

| Variável | Notas |
|----------|-------|
| `DATABASE_URL` | PostgreSQL local em desenvolvimento |
| `REVALIDATE_SECRET` | Igual na web e na API; sem ele, o site só mostra alterações do CMS quando a cache expira |
| `NEXT_PUBLIC_S3_PUBLIC_URL` | Domínio público das imagens |
| `ALLOW_SEARCH_INDEXING` | `false` em local e staging; `true` só em produção |
| `CONTACT_RETENTION_MONTHS` | Por omissão `24`: anonimização RGPD e texto em `/privacidade` |
| `CONTACT_NOTIFY_TO` | Destino dos avisos de contacto |

---

## Funcionalidades

| Área | Notas |
|------|-------|
| Auth | Better Auth no Nest (`/api/auth`), passkeys, `mustChangePassword`, rate limit de login |
| Papéis | `ADMIN` \| `EDITOR`; só `ADMIN` gere utilizadores |
| Site público | `/`, `/about`, `/galeria`, `/equipa`, `/noticias`, `/privacidade` e formulário de contacto |
| Backoffice | Listas do CMS, conteúdo do site por separadores, contactos, perfil e segurança |
| Media | Upload por presign S3/R2 (Garage em local), com `size` assinado; imagens até 5 MB, PDF até 10 MB |
| Imagens públicas | Servidas com `next/image`, em WebP e no tamanho adequado ao ecrã |
| Contacto | Honeypot, consentimento e limites por IP e email; BullMQ, SMTP e email de confirmação |
| Cache | Redis (30 min) e Next (15 min), invalidados ao gravar através de `/api/revalidate` |
| RGPD | Exportar e apagar no backoffice; anonimização automática após N meses |
| Sentry | Opcional: `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` |

---

## Base de dados

O ORM é o **TypeORM**, com `synchronize: false`: o esquema só muda através de migrations.

- As migrations estão em `packages/database/src/migrations`.
- Cada migration nova tem de ser adicionada à lista em `packages/database/src/data-source.ts`.
- Para aplicar: `pnpm db:deploy`.

---

## Testes

### Unitários (API)

```bash
pnpm test        # Vitest + coverage (apps/api)
pnpm typecheck
pnpm lint
```

### E2E (Playwright)

Com o site e a API a correr (`pnpm dev` ou compose):

```bash
pnpm exec playwright install chromium   # uma vez, e após atualizar o Playwright
pnpm test:e2e
```

| Suite | O que verifica |
|-------|----------------|
| `smoke` | Home, robots/sitemap, login e redirecionamento do backoffice sem sessão |
| `csp` | Nonce, políticas e erros CSP em `/`, `/galeria`, `/equipa`, `/noticias` |
| `a11y` | axe (WCAG) nas páginas públicas e no painel após login |
| `responsive` | Scroll horizontal de 320 a 1440 px, menu móvel, campos em telemóvel e links com âncora |

Variáveis opcionais: `E2E_BASE_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.

O teste de CSP precisa de um build de produção com imagens em HTTPS ou sem imagens: a CSP de produção bloqueia media servida por HTTP.

### CI (GitHub Actions)

Jobs: **audit**, **test**, **docker** e **compose-smoke**. A proteção do `main` exige **test** e **docker**.

O `compose-smoke` sobe o stack Docker, incluindo o serviço `postgres`, testa API, media e web, e corre o Playwright.

### Produção

```bash
pnpm verify:production -- https://SEU_DOMINIO
# VERIFY_HOST=IP_VPS pnpm verify:production -- https://SEU_DOMINIO
```

---

## Deploy (Coolify)

Guia completo em [docker/COOLIFY.md](docker/COOLIFY.md) e checklist em [docs/RUNBOOK.md](docs/RUNBOOK.md).

- **Fluxo:** cliente → Traefik (TLS) → web → API, com `/api/*` encaminhado pelo Next (cookies first-party).
- **Portas:** não publicar `3000` nem `3001` no host.
- **Base de dados:** serviço `postgres` do `docker-compose.prod.yml`.
- **Variáveis:** `ALLOW_SEARCH_INDEXING=true` e `REVALIDATE_SECRET` forte, igual na web e na API.
- **Serviços externos:** Resend (SPF, DKIM, DMARC) para email e Cloudflare R2 para ficheiros.
- **Backups:** `pg_dump` e teste de restauro (ver RUNBOOK).

---

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Web e API em desenvolvimento |
| `pnpm build` | Build do monorepo (Turbo) |
| `pnpm docker:up` | Arranca Redis, Garage e Mailpit |
| `pnpm docker:down` | Para os serviços Docker, sem apagar dados |
| `pnpm db:deploy` | Aplica as migrations |
| `pnpm db:seed` | Cria a conta admin e o conteúdo inicial |
| `pnpm test` / `test:e2e` | Testes da API / Playwright |
| `pnpm typecheck` / `lint` | Verificação de tipos / ESLint |
| `pnpm verify:production` | Verificações contra um domínio publicado |
| `pnpm generate:favicons` | Favicons a partir do logótipo |

---

## Licença

Projeto da Corujinha. O repositório não inclui licença de reutilização.
