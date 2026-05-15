# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| < 0.2   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **Do not** open a public GitHub issue.
2. Send details to the security team at **security@cerebra-ai.example.com** (replace with actual address).
3. Include a description of the vulnerability, steps to reproduce, and affected versions.
4. Allow up to 72 hours for an initial response.

## Security Features

### Authentication
- API key-based bearer token authentication (configurable via `CEREBRA_API_KEY`)
- When auth is disabled, all routes except `/health`, `/docs`, and Telegram webhook are protected
- WebSocket connections authenticated via `?token=` query parameter

### Encryption at Rest
- Provider API keys encrypted using Fernet (symmetric encryption) with PBKDF2 key derivation
- Encryption key configured via `ENCRYPTION_KEY` environment variable (min 16 chars)
- When no encryption key is set, API keys stored in plaintext (dev mode only)

### SSRF Protection
- `http_request` tool blocks requests to private/internal IP addresses
- DNS-based resolution prevents hostname-based bypasses
- Known private hosts blocked: localhost, 127.0.0.1, ::1, 0.0.0.0, host.docker.internal

### Rate Limiting
- Per-IP sliding window rate limiting
- 10 requests/minute on `/runs` endpoint
- 100 requests/minute on all other endpoints
- 5 MB maximum request body size

### Input Validation
- All API inputs validated via Pydantic v2 schemas
- SQL injection prevented via SQLAlchemy ORM parameterized queries
- No raw `eval()` — AST-based calculator parser
- Restricted Python sandbox for `code_interpreter` tool

## Security Best Practices for Deployment

1. **Always set CEREBRA_API_KEY** to a random value in production
2. **Always set ENCRYPTION_KEY** to a random 32+ character value
3. **Use HTTPS** with a valid TLS certificate
4. **Set restrictive CORS origins** to only your frontend domain
5. **Use a dedicated database user** with minimal required permissions
6. **Run behind a reverse proxy** (nginx, Cloudflare, AWS ALB)
7. **Enable database encryption at rest** (RDS encryption, etc.)
8. **Rotate API keys regularly**
9. **Monitor logs** for unusual access patterns
