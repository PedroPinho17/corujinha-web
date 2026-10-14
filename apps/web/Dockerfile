FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=same-origin
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_S3_PUBLIC_URL=
ARG NEXT_PUBLIC_S3_BUCKET=corujinha-media
ARG NEXT_PUBLIC_S3_PUBLIC_INCLUDE_BUCKET=
ARG INTERNAL_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_S3_PUBLIC_URL=$NEXT_PUBLIC_S3_PUBLIC_URL
ENV NEXT_PUBLIC_S3_BUCKET=$NEXT_PUBLIC_S3_BUCKET
ENV NEXT_PUBLIC_S3_PUBLIC_INCLUDE_BUCKET=$NEXT_PUBLIC_S3_PUBLIC_INCLUDE_BUCKET
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_STANDALONE=true

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN echo "shamefully-hoist=true" >> .npmrc \
  && pnpm install --frozen-lockfile --filter web...

FROM deps AS build
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared
RUN pnpm --filter @corujinha/shared build
RUN pnpm --filter web build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public

USER node
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "server.js"]
