# Fix Checklist

## P0 — Must-fix (crashes / silent failures)

- [x] **C2**: Wrap `run_workflow()` in try/except — set status to "failed" on error
- [x] **C3**: Add null check for `pubsub` in WebSocket endpoint
- [x] **M5**: Add error handling (`onError`) to all frontend mutation hooks
- [x] **m6**: Fix `channel_id=None` on non-nullable FK in `channels.py`
- [x] **m15**: Handle agent_node silent exit on iteration limit

## P1 — Security

- [x] **C1**: Replace `eval()` in calculator with AST-based safe evaluator
- [x] **C4**: Fix CORS — use configurable origin list, add `CORS_ORIGINS` env var
- [x] **M11**: Add SSRF protection (private IP blocklist) to `http_request` tool
- [ ] **C6**: Add basic auth or API key guard

## P1 — Infrastructure

- [x] **C5**: Add nginx config with SPA fallback + API proxy
- [x] **M6**: Add `.dockerignore` for backend and frontend
- [x] **M9**: Wire nginx config into frontend Dockerfile
- [x] **m4**: Add healthcheck for backend service in docker-compose
- [x] **m10**: Configure asyncpg pool size via env vars
- [x] **m14**: Remove `--reload` from production Dockerfile

## P2 — Test coverage

- [ ] **M1a**: Test channels API + Telegram webhook
- [ ] **M1b**: Test WebSocket endpoint
- [ ] **M1c**: Test tools (calculator with safe eval, web_crawler, http_request)
- [ ] **M1d**: Test router_node and agent_node
- [ ] **M1e**: Add frontend test framework (vitest)

## P2 — Polish

- [x] **C7**: Fix Vite proxy — consistent `/api` prefix across frontend + nginx
- [ ] **M2**: Create `TelegramSetup.tsx` component or remove docs reference
- [x] **M4**: Add `web_crawler` to frontend tool list
- [ ] **M8**: Fix router docs/impl mismatch — update EdgeMenu placeholder
- [x] **m1**: Complete `.env.example` with all vars
- [ ] **m2**: Either wire up TokenChart or remove dead code
- [ ] **m3**: Either wire up useRunStore or remove dead code
- [ ] **m8**: Make RouterNode emit events
- [x] **m9**: Use per-run Redis channels instead of global filter

## P3 — Low priority

- [ ] **M3**: Generate initial Alembic migration
- [ ] **M7**: Purge `test.db` from git history
- [ ] **M10**: Fix `make dev-backend` path
- [x] **m5**: Move inline imports to top in `channels.py`
- [ ] **m7**: Replace fragile DuckDuckGo scrape with proper API
- [ ] **m12**: Add frontend test deps
- [x] **m13**: Use env vars for Postgres creds in docker-compose
- [ ] **M11**: Implement `human_node.py` or remove from docs

**Fixed: 17 / 28 items**
