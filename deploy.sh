#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-nest-portal}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
export CI="${CI:-true}"
export PATH="$PATH:/usr/local/bin:/usr/bin:/root/.npm-global/bin:/root/.local/share/pnpm/bin"

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

PM2_BIN="${PM2_BIN:-$(command -v pm2 || true)}"
if [ -z "$PM2_BIN" ] && command -v npm >/dev/null 2>&1; then
  NPM_PREFIX="$(npm prefix -g 2>/dev/null || true)"
  if [ -n "$NPM_PREFIX" ] && [ -x "$NPM_PREFIX/bin/pm2" ]; then
    PM2_BIN="$NPM_PREFIX/bin/pm2"
  fi
fi

if [ -n "$PM2_BIN" ]; then
  "$PM2_BIN" restart "$APP_NAME" || "$PM2_BIN" start "pnpm run start:prod" --name "$APP_NAME"
  "$PM2_BIN" save
else
  echo "pm2 is not installed. Install it first: npm install -g pm2"
  echo "Then run this script again, or start manually: pnpm run start:prod"
  exit 1
fi
