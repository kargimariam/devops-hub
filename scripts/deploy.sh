#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION=$(date +%Y%m%d%H%M%S)
DEPLOY_DIR="deployments"
BLUE_DIR="$DEPLOY_DIR/blue"
GREEN_DIR="$DEPLOY_DIR/green"
ACTIVE_DIR="production"
TEMP_STAGING="green_staging"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"
MAX_RETRIES=10

echo "Starting Blue-Green Deployment (version: $VERSION)"

if ! curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
  echo "WARNING: Current production is not reachable at $HEALTH_URL"
  echo "Start the app first with: bash scripts/setup.sh"
fi

echo "Building new release..."
npm ci
npm run lint
npm run test
npm run build

rm -rf "$TEMP_STAGING"
mkdir -p "$TEMP_STAGING"
cp -r src package.json tsconfig.json vite.config.ts vitest.config.ts server.ts index.html "$TEMP_STAGING/"
cp -r dist "$TEMP_STAGING/"
cp scripts/*.sh "$TEMP_STAGING/" 2>/dev/null || true

mkdir -p "$DEPLOY_DIR"
rm -rf "$GREEN_DIR"
mkdir -p "$GREEN_DIR"
cp -r "$TEMP_STAGING/." "$GREEN_DIR/"
rm -rf "$TEMP_STAGING"

echo "Running health check on GREEN candidate..."
(
  cd "$GREEN_DIR"
  NODE_ENV=production APP_PORT=3001 npx tsx server.ts &
  GREEN_PID=$!
  trap "kill $GREEN_PID 2>/dev/null || true" EXIT

  for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf http://localhost:3001/api/health >/dev/null 2>&1; then
      echo "GREEN health check passed."
      kill $GREEN_PID 2>/dev/null || true
      break
    fi
    if [ "$i" -eq "$MAX_RETRIES" ]; then
      echo "ERROR: GREEN health check failed. Deployment aborted."
      kill $GREEN_PID 2>/dev/null || true
      exit 1
    fi
    sleep 2
  done
)

if [ -d "$BLUE_DIR" ]; then
  echo "Backing up current BLUE to rollback_v..."
  rm -rf "$DEPLOY_DIR/rollback_v"
  mkdir -p "$DEPLOY_DIR/rollback_v"
  cp -r "$BLUE_DIR/." "$DEPLOY_DIR/rollback_v/"
fi

echo "Switching traffic BLUE -> GREEN"
rm -rf "$BLUE_DIR"
mkdir -p "$BLUE_DIR"
cp -r "$GREEN_DIR/." "$BLUE_DIR/"
rm -rf "$GREEN_DIR"

rm -rf "$ACTIVE_DIR"
mkdir -p "$ACTIVE_DIR"
cp -r "$BLUE_DIR/." "$ACTIVE_DIR/"

echo "Deployment SUCCESSFUL."
echo "To rollback: bash scripts/rollback.sh"
