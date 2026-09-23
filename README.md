# Portal Corujinha

Monorepo Next.js 15 + NestJS + PostgreSQL + Prisma + Redis + BullMQ + S3 + Better Auth (Passkey) + shadcn/ui + Docker/Coolify + Sentry.

Espelha o padrão [vh-team-fighters](../vh-team-fighters) / ClubOS. Fonte Laravel: `C:\Projetos_WEB\corujinha`.

## Estrutura

```
apps/web/           Next.js 15 — site público + /admin
apps/api/           NestJS — Better Auth, CMS API, BullMQ, S3
packages/database/  Prisma schema + migrations + seed
packages/shared/    tipos + DEFAULT_SITE_CONTENT
docker/             api-entrypoint.sh + COOLIFY.md
```

## Arranque local

```bash
cp .env.example .env
pnpm install
pnpm docker:up
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm migrate:legacy   # opcional: MySQL Laravel + imagens → Postgres/S3
pnpm --filter @corujinha/shared build
pnpm dev
```

| Serviço | URL |
|---------|-----|
| Site | http://localhost:3000 |
| Admin | http://localhost:3000/admin/login |
| API health | http://localhost:3001/api/health |
| Mailpit | http://localhost:8026 |
| MinIO | http://localhost:9013 |

Seed admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` no `.env`.

## Feature map

| Área | Notas |
|------|--------|
| Auth | Better Auth no Nest (`/api/auth`), passkeys, `mustChangePassword` |
| Roles | `ADMIN` \| `EDITOR` — só ADMIN gere users |
| Público | `/`, `/about`, `/galeria`, `/equipa`, `/noticias`, contacto |
| Admin | CRUDs CMS + Conteúdo do Site + perfil + segurança |
| Media | Presign S3/MinIO |
| Contacto | BullMQ → SMTP |
| Sentry | Opcional via `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` |

## Coolify

Ver [docker/COOLIFY.md](docker/COOLIFY.md) — um domínio, `/` → web, `/api/*` → api.
