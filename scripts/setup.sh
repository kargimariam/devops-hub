#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== DevOps Final - Environment Setup ==="

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is required. Install Docker Desktop and try again."
  exit 1
fi

if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env
fi

echo "Starting application and observability stack..."
docker compose up --build -d

echo "Waiting for application health check..."
ATTEMPTS=0
MAX_ATTEMPTS=30
until curl -sf http://localhost:3000/api/health >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "ERROR: Application did not become healthy in time."
    docker compose ps
    exit 1
  fi
  sleep 2
done

echo ""
echo "Environment is ready."
echo "  App:         http://localhost:3000"
echo "  Metrics:     http://localhost:3000/metrics"
echo "  Prometheus:  http://localhost:9090"
echo "  Grafana:     http://localhost:3001  (admin / admin)"
echo "  Loki:        http://localhost:3100"
echo ""
echo "Run health monitor: bash scripts/monitor.sh"
echo "Stop everything:  docker compose down"
