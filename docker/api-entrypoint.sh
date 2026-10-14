#!/bin/sh
set -e

# Em compose, remontar URLs internos a partir de POSTGRES_HOST / REDIS_HOST
# (ignora @localhost do .env do host).
if [ -n "${POSTGRES_HOST:-}" ]; then
  ENCODED_USER=$(node -p "encodeURIComponent(process.env.POSTGRES_USER || 'corujinha')")
  ENCODED_PW=$(node -p "encodeURIComponent(process.env.POSTGRES_PASSWORD || '')")
  DB_NAME="${POSTGRES_DB:-corujinha}"
  export DATABASE_URL="postgresql://${ENCODED_USER}:${ENCODED_PW}@${POSTGRES_HOST}:5432/${DB_NAME}?schema=public"
fi

if [ -n "${REDIS_HOST:-}" ]; then
  export REDIS_URL="redis://${REDIS_HOST}:6379"
fi

cd /app/packages/database
npx prisma migrate deploy
cd /app/apps/api
exec node dist/main.js
