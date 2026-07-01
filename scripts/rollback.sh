#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEPLOY_DIR="deployments"
BLUE_DIR="$DEPLOY_DIR/blue"
BACKUP_DIR="$DEPLOY_DIR/rollback_v"
ACTIVE_DIR="production"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"

echo "ROLLBACK INITIATED..."

if [ ! -d "$BACKUP_DIR" ]; then
  echo "ERROR: No backup version found in $BACKUP_DIR"
  exit 1
fi

echo "Restoring previous version..."
rm -rf "$BLUE_DIR"
mkdir -p "$BLUE_DIR"
cp -r "$BACKUP_DIR/." "$BLUE_DIR/"

rm -rf "$ACTIVE_DIR"
mkdir -p "$ACTIVE_DIR"
cp -r "$BLUE_DIR/." "$ACTIVE_DIR/"

if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
  echo "Rollback complete. Production health check passed."
else
  echo "Rollback complete. Restart the app to apply restored files:"
  echo "  docker compose up --build -d"
fi
