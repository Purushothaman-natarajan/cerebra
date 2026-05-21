# Deployment Guide

> We are not deploying. This document ensures we **can** deploy when needed.

---

## Prerequisites

- Docker & Docker Compose v2
- Domain name (for HTTPS + Telegram webhook)
- SMTP server or notification channel (optional)

---

## Quick Deploy (Single Server)

```bash
# 1. Clone & configure
git clone https://github.com/Purushothaman-natarajan/cerebra.git
cd cerebra
cp .env.example .env
nano .env   # add GEMINI_API_KEY, CEREBRA_API_KEY, ENCRYPTION_KEY

# 2. Start all services
docker compose up --build -d

# 3. Verify
curl http://localhost:8000/health
curl http://localhost:5173/
```

---

## Production Architecture

```
                         Cloudflare / Load Balancer (TLS termination)
                                      │
                             ┌────────▼────────┐
                             │   nginx (HTTPS)  │
                             │  orch.id domain  │
                             └────────┬────────┘
                                      │
                    ┌─────────────────┼──────────────────┐
                    │                 │                   │
             ┌──────▼──────┐  ┌──────▼──────┐   ┌───────▼───────┐
             │   FastAPI    │  │   Frontend  │   │   Telegram    │
             │   (backend)  │  │  (nginx+Spa)│   │   webhook     │
             └──────┬──────┘  └─────────────┘   └───────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
   ┌─────▼─────┐        ┌─────▼─────┐
   │ PostgreSQL│        │   Redis   │
   └───────────┘        └───────────┘
```

---

## Environment Variables (Production)

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `CEREBRA_API_KEY` | Yes | Protects all API endpoints (set this!) |
| `ENCRYPTION_KEY` | Yes | Encrypts provider API keys at rest |
| `TELEGRAM_BOT_TOKEN` | For Telegram | Telegram bot token |
| `TELEGRAM_WEBHOOK_URL` | For Telegram | Public URL for webhook |
| `CORS_ORIGINS` | Yes | Your frontend domain |
| `REDIS_PASSWORD` | Recommended | Redis auth password |
| `POSTGRES_PASSWORD` | Yes | Postgres password (change default!) |
| `DATABASE_URL` | No | Defaults to docker-compose internal URL |

---

## Production docker-compose.yml

Create `docker-compose.prod.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-cerebra}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-cerebra}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-cerebra}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    restart: always
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER:-cerebra}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-cerebra}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      CEREBRA_API_KEY: ${CEREBRA_API_KEY}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      TELEGRAM_WEBHOOK_URL: ${TELEGRAM_WEBHOOK_URL}
      CORS_ORIGINS: ${CORS_ORIGINS}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pgdata:
  redisdata:

networks:
  default:
    name: cerebra-network
```

Run with:
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## HTTPS Setup (Let's Encrypt)

For production, the frontend nginx should terminate TLS.
Mount certs into the nginx container and uncomment the HTTPS `server` block in `nginx.conf`:

```yaml
  frontend:
    build: ./frontend
    ports:
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
```

### Quick TLS with Caddy (alternative)

Replace the frontend service with Caddy for automatic HTTPS:

```yaml
  frontend:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/dist:/usr/share/caddy
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - backend
```

With `Caddyfile`:
```
cerebra.example.com {
    reverse_proxy /api/* backend:8000
    reverse_proxy /ws/* backend:8000
    root * /usr/share/caddy
    try_files {path} /index.html
}
```

---

## Monitoring & Logging

### Health Check Endpoint

```
GET /health
```

The health endpoint checks database connectivity and returns service version info.
Configure your monitoring tool (UptimeRobot, Better Uptime, etc.) to ping this every 60s.

### Viewing Logs

```bash
# Docker logs
docker compose logs backend -f --tail=100
docker compose logs frontend -f --tail=100

# Backend produces structured JSON logs:
# {"timestamp":"...","level":"INFO","service":"cerebra-backend","request_id":"...","message":"..."}
```

### External Monitoring Setup

1. **Uptime monitoring**: Configure your provider to check `https://your-domain.com/health`
2. **Error tracking**: Integrate Sentry or similar by adding middleware
3. **Application metrics**: Add Prometheus endpoint (planned for future release)

---

## Backup & Restore

### Database Backup

```bash
# Manual backup
docker compose exec postgres pg_dump -U cerebra cerebra > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup (add to crontab)
0 3 * * * cd /opt/cerebra && docker compose exec -T postgres pg_dump -U cerebra cerebra > backups/daily_$(date +\%Y\%m\%d).sql && find backups/ -name "*.sql" -mtime +30 -delete
```

### Restore

```bash
# Restore from backup
cat backup_20260501_120000.sql | docker compose exec -T postgres psql -U cerebra cerebra
```

### Volume Snapshots

For production, use your cloud provider's volume snapshot feature (RDS snapshots, EBS snapshots, etc.).

---

## Running Database Migrations

```bash
# Production: run migrations before starting the new version
docker compose run --rm backend alembic upgrade head
```

Migrations are NOT run automatically on startup. Run them manually during deployment.

---

## Security Checklist

Before exposing to the internet:

- [ ] `CEREBRA_API_KEY` set to a strong random value
- [ ] `ENCRYPTION_KEY` set to a strong random value
- [ ] `POSTGRES_PASSWORD` changed from default
- [ ] `REDIS_PASSWORD` set
- [ ] `CORS_ORIGINS` set to your domain only
- [ ] HTTPS enabled (Let's Encrypt or Caddy)
- [ ] Rate limiting active (built-in, 10/min on /runs)
- [ ] Firewall: only ports 80/443 open
- [ ] Regular volume backups for `pgdata`
- [ ] Database migrations run manually
- [ ] Monitoring health check configured

---

## Scaling Considerations

| Bottleneck | Mitigation |
|------------|------------|
| Postgres connection pool | Increase `DB_POOL_SIZE` / `DB_MAX_OVERFLOW` |
| LLM rate limits | Multiple provider API keys, round-robin |
| Redis memory | Monitor `used_memory`, set `maxmemory` |
| WebSocket connections | Horizontally scale backend (Redis pub/sub handles fan-out) |
| Frontend static assets | Serve via CDN (Cloudflare, Fastly) |
