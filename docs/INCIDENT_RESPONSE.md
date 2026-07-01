# Incident Response Guide

## Service Availability Objective (SLO)

- **Target availability:** 99% during evaluation/demo windows
- **Health check interval:** every 30 seconds (`scripts/monitor.sh`)
- **Maximum acceptable error rate:** 5 errors per minute (Prometheus `HighErrorRate` alert)

## Alert: HighErrorRate (CRITICAL)

**Trigger:** `rate(app_errors_total[1m]) * 60 > 5`

### Immediate actions

1. Open Grafana Alerting: http://localhost:3001/alerting/list
2. Confirm the alert is firing in Prometheus: http://localhost:9090/alerts
3. Inspect error logs in Grafana Explore:
   ```logql
   {job="devops-app"} | json | level="error"
   ```
4. Check recent deployments:
   ```bash
   docker compose ps
   docker compose logs app --tail 100
   ```

### Mitigation

1. **Rollback** if a bad deployment caused the spike:
   ```bash
   bash scripts/rollback.sh
   docker compose up --build -d
   ```
2. **Restart** the application container:
   ```bash
   docker compose restart app
   ```
3. **Simulate recovery verification:**
   ```bash
   bash scripts/verify-deployment.sh
   ```

## Failure Recovery Automation

| Scenario | Automated response |
|---|---|
| Container crash | Docker `restart: unless-stopped` policy |
| Failed CI pipeline | GitHub Actions blocks merge/deploy |
| Failed post-deploy check | `verify-deployment.sh` exits non-zero in CI |
| Bad release (local blue-green) | `scripts/rollback.sh` restores previous version |

## Escalation (demo/documentation)

1. On-call engineer checks Grafana + Prometheus
2. Roll back to last known good version
3. Document root cause in commit message / issue tracker
4. Re-run CI before redeploying

## Useful commands

```bash
# Full environment restart
docker compose down && docker compose up --build -d

# Trigger test errors (alert demo)
for i in $(seq 1 20); do curl http://localhost:3000/api/simulate-error; done

# View health monitor log
tail -f health-check.log
```
