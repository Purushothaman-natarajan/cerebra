# Fix Checklist

## Previous rounds (batches 1-2) — 21 fixed ✓

- [x] **B1**: Async LLM call (blocked event loop)
- [x] **B2**: Router condition routing (broken conditional edges)
- [x] **B3**: `nulls_first()` typo
- [x] **B4**: ChannelsPage save button (no-op)
- [x] **RUN**: Add `run.ps1` / `run.sh` one-click scripts + `pyproject.toml` for uv

- [x] **C1**: Replace `eval()` in calculator with AST-based safe evaluator
- [x] **C2**: Wrap `run_workflow()` in try/except — set status to "failed" on error
- [x] **C3**: Add null check for `pubsub` in WebSocket endpoint
- [x] **C4**: Fix CORS — use configurable origin list, add `CORS_ORIGINS` env var
- [x] **C5**: Add nginx config with SPA fallback + API proxy
- [x] **C7**: Fix Vite proxy — consistent `/api` prefix across frontend + nginx
- [x] **M4**: Add `web_crawler` to frontend tool list
- [x] **M5**: Add error handling (`onError`) to all frontend mutation hooks
- [x] **M6**: Add `.dockerignore` for backend and frontend
- [x] **M9**: Wire nginx config into frontend Dockerfile
- [x] **M10**: Fix `make dev-backend` path (was wrong PYTHONPATH)
- [x] **M11**: Add SSRF protection (private IP blocklist) to `http_request` tool
- [x] **m1**: Complete `.env.example` with all vars
- [x] **m4**: Add healthcheck for backend service in docker-compose
- [x] **m5**: Move inline imports to top in `channels.py`
- [x] **m6**: Fix `channel_id=None` on non-nullable FK in `channels.py`
- [x] **m9**: Use per-run Redis channels instead of global filter
- [x] **m10**: Configure asyncpg pool size via env vars
- [x] **m13**: Use env vars for Postgres creds in docker-compose
- [x] **m14**: Remove `--reload` from production Dockerfile
- [x] **m15**: Handle agent_node silent exit on iteration limit

---

## P0 — Bugs (newly found)

- [x] **B1**: `llm.py:44` — `generate_content()` is synchronous inside `async def` — blocks event loop. Fix: use `client.aio.models.generate_content()` (async SDK).
- [x] **B2**: `compiler.py:25` + `router_node.py` — router condition evaluation broken. Compiler now compares `_next` against edge `condition` value (route name), not target node ID.
- [x] **B3**: `run_service.py:11` — `nullsfirst()` typo → `nulls_first()`.
- [x] **B4**: `ChannelsPage.tsx:28` — Save button now has `onClick` handler with state management and API call to `POST /channels`.

## P0 — Must-fix (crashes / silent failures)

- [ ] **C6**: Add basic auth or API key guard

## P1 — Missing Core Features

- [ ] **H1**: Missing `human_node.py` — human-in-the-loop workflows not possible
- [ ] **H2**: Missing Token/Cost tracking — `TokenChart.tsx` is dead UI, no backend data
- [ ] **H3**: Missing Schedule trigger — no APScheduler integration
- [ ] **H4**: No Alembic migrations — `create_all` on startup only, no migration workflow
- [ ] **H5**: No API endpoint or UI to import workflow template JSON files
- [ ] **H6**: SSRF DNS bypass — `http_request.py:25` DNS names resolving to private IPs bypass blocklist

## P2 — Polish / Dead Code / Docs Mismatch

- [ ] **P1**: `TokenChart.tsx` — dead code, never imported
- [ ] **P2**: `useRunStore` — dead code, never imported
- [ ] **P3**: Missing `TelegramSetup.tsx` component — inline ChannelsPage form is non-functional
- [ ] **P4**: `EdgeMenu.tsx:14` — labels "Condition (Python expr)" but backend uses keyword matching
- [ ] **P5**: `router_node.py` — doesn't emit events (FIXLIST m8)
- [ ] **P6**: `requirements.txt` includes unused `python-telegram-bot` (code uses raw httpx) and `aiosqlite` (test-only should be optional)

## P3 — Minor

- [ ] **Q1**: `schemas.py` — `channel_id` defaults to `""` instead of `None`, inconsistent
- [ ] **Q2**: `schemas.py` — manual `from_orm` everywhere, could use `from_attributes=True`
- [ ] **Q3**: `web_search.py` — fragile DuckDuckGo lite endpoint, no structured API
- [ ] **Q4**: `Calculator` model default `"gemini-2.0-flash"` hardcoded in AgentForm.tsx
- [ ] **Q5**: `agent_id: str` in agents.py — accepts any string, should validate UUID
- [ ] **Q6**: Frontend `@/` path alias configured in tsconfig but never used
- [ ] **Q7**: Canvas stale closure — `handleNodesChange` uses `setTimeout` with potentially stale state
- [ ] **Q8**: No frontend test framework (vitest) installed
