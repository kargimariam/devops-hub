#!/bin/bash

URL="${HEALTH_URL:-http://localhost:3000/api/health}"
LOG_FILE="${LOG_FILE:-health-check.log}"
INTERVAL="${INTERVAL:-30}"

echo "Starting health monitor..."
echo "Target: $URL"
echo "Logging to: $LOG_FILE"
echo "Press Ctrl+C to stop."

while true; do
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

  if RESPONSE=$(curl -sf "$URL" 2>/dev/null); then
    STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "[$TIMESTAMP] Health check: ${STATUS:-unknown}" >> "$LOG_FILE"
  else
    echo "[$TIMESTAMP] Health check: FAILED (server down or unreachable)" >> "$LOG_FILE"
  fi

  sleep "$INTERVAL"
done
