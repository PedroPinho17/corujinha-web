#!/bin/sh
set -e
cd /app/packages/database
npx prisma migrate deploy
cd /app
node dist/main.js
