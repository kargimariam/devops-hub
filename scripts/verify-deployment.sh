#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

HEALTH_URL="${HEALTH_URL:-http://localhost:3000/api/health}"
METRICS_URL="${METRICS_URL:-http://localhost:3000/metrics}"

echo "Running post-deployment verification..."

for i in 1 2 3 4 5; do
  if curl -sf "$HEALTH_URL" >/dev/null; then
    echo "Health check passed."
    break
  fi
  if [ "$i" -eq 5 ]; then
    echo "ERROR: Health check failed after deployment."
    exit 1
  fi
  sleep 3
done

if curl -sf "$METRICS_URL" | grep -q "app_requests_total"; then
  echo "Metrics endpoint verified."
else
  echo "ERROR: Metrics endpoint missing expected counters."
  exit 1
fi

echo "Post-deployment verification passed."
