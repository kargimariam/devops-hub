# DevOps Final - One-command environment setup (Windows PowerShell)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "=== DevOps Final - Environment Setup ===" -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is required. Install Docker Desktop and try again."
}

if (-not (Test-Path .env)) {
    Write-Host "Creating .env from .env.example..."
    Copy-Item .env.example .env
}

Write-Host "Starting application and observability stack..."
docker compose up --build -d

Write-Host "Waiting for application health check..."
$attempts = 0
$maxAttempts = 30
while ($attempts -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 3
        if ($response.StatusCode -eq 200) { break }
    } catch {
        Start-Sleep -Seconds 2
        $attempts++
    }
}

if ($attempts -ge $maxAttempts) {
    Write-Error "Application did not become healthy in time."
}

Write-Host ""
Write-Host "Environment is ready." -ForegroundColor Green
Write-Host "  App:         http://localhost:3000"
Write-Host "  Metrics:     http://localhost:3000/metrics"
Write-Host "  Prometheus:  http://localhost:9090"
Write-Host "  Grafana:     http://localhost:3001  (admin / admin)"
Write-Host "  Loki:        http://localhost:3100"
Write-Host ""
Write-Host "Run health monitor: bash scripts/monitor.sh"
Write-Host "Stop everything:  docker compose down"
