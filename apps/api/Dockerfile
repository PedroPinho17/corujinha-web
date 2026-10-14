FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
ENV HUSKY=0

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/
RUN echo "shamefully-hoist=true" >> .npmrc \
  && pnpm install --frozen-lockfile --filter @corujinha/api...

FROM deps AS builder
COPY apps/api ./apps/api
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY docker/api-entrypoint.sh ./docker/api-entrypoint.sh
RUN pnpm --filter @corujinha/shared build
RUN pnpm --filter @corujinha/database generate
RUN pnpm --filter @corujinha/database build
RUN pnpm --filter @corujinha/api build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HUSKY=0
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY --from=builder --chown=node:node /app/package.json /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=node:node /app/packages/database ./packages/database
COPY --from=builder --chown=node:node /app/packages/shared ./packages/shared
COPY --from=builder --chown=node:node /app/docker/api-entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh && chown node:node ./entrypoint.sh

USER node
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["/app/entrypoint.sh"]
