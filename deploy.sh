#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-nest-portal}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
export CI="${CI:-true}"

cd "$APP_DIR"

if [ ! -f ".env.production" ]; then
  echo "Missing .env.production in $APP_DIR"
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
  else
    echo "pnpm is not installed and corepack is unavailable"
    exit 1
  fi
fi

pnpm install --prod=false --frozen-lockfile
pnpm run prisma:generate:prod
pnpm run prisma:migrate:deploy:prod

if command -v pm2 >/dev/null 2>&1; then
  pm2 restart "$APP_NAME" || pm2 start "pnpm run start:prod" --name "$APP_NAME"
  pm2 save
else
  echo "pm2 is not installed. Install it first: npm install -g pm2"
  echo "Then run this script again, or start manually: pnpm run start:prod"
  exit 1
fi
