# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.2.x | ✅ |
| < 0.2 | ❌ |

---

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **Do not** open a public GitHub issue.
2. Open a [GitHub Security Advisory](https://github.com/Purushothaman-natarajan/cerebra/security/advisories/new) (preferred).
3. Include a description of the vulnerability, steps to reproduce, and affected versions.
4. Allow up to 72 hours for an initial response.

---

## Security Features

### Authentication
- API key-based bearer token authentication (configurable via `CEREBRA_API_KEY`)
- When `CEREBRA_API_KEY=no_key`, authentication is fully disabled (development mode)
- WebSocket connections authenticated via `?token=` query parameter
- Public endpoints: `/health`, `/docs`, Telegram webhook (no auth required)

### Encryption at Rest
- Provider API keys encrypted using Fernet (symmetric encryption) with PBKDF2 key derivation
- Encryption key configured via `ENCRYPTION_KEY` environment variable (min 16 chars)
- When no encryption key is set, a warning is logged and keys stored in plaintext (dev mode only)

### SSRF Protection
- `http_request` tool blocks requests to private/internal IP addresses
- DNS-based resolution prevents hostname-based bypasses
- 5-second DNS timeout to prevent hanging on unresponsive hosts
- Blocked ranges: localhost (127.0.0.0/8), private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), link-local (169.254.0.0/16), IPv6 loopback (::1), Docker host (host.docker.internal)

### Rate Limiting
- Per-IP sliding window rate limiting
- 10 requests/minute on `/runs` endpoint
- 100 requests/minute on all other endpoints
- 5 MB maximum request body size
- Rate limit headers included in all responses

### Input Validation
- All API inputs validated via Pydantic v2 schemas
- SQL injection prevented via SQLAlchemy ORM parameterized queries
- No raw `eval()` — AST-based calculator parser for safe math evaluation
- Restricted Python builtins for `code_interpreter` tool sandbox
- Request body size limited to 5 MB

### WebSocket Security
- Origin validation against configured `CORS_ORIGINS`
- Bearer token authentication via query parameter
- Heartbeat mechanism to detect stale connections

---

## Security Best Practices for Deployment

1. **Always set `CEREBRA_API_KEY`** to a cryptographically random value in production
2. **Always set `ENCRYPTION_KEY`** to a random 32+ character value
3. **Use HTTPS** with a valid TLS certificate (Let's Encrypt or Caddy)
4. **Set restrictive `CORS_ORIGINS`** to only your frontend domain
5. **Use a dedicated database user** with minimal required permissions
6. **Run behind a reverse proxy** (nginx, Cloudflare, AWS ALB)
7. **Enable database encryption at rest** (RDS encryption, etc.)
8. **Rotate API keys** periodically
9. **Monitor logs** for unusual access patterns
10. **Keep dependencies updated** — regularly run `dependabot` or `npm audit`
