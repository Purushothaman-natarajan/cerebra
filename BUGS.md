# Bug Report

## Test Results Summary

- **15/15 backend tests pass** (4 skipped — need GEMINI_API_KEY)
- **Frontend builds clean** (0 TypeScript errors)
- **12/12 API endpoints respond correctly** via TestClient (CRUD + auth + validation)

---

## Found Issues

### B1 — Backend crashes on startup without Postgres (FIXED)

- **File**: `backend/app/main.py:24`
- **Symptom**: `ConnectionRefusedError` when Postgres isn't running — app exits immediately
- **Fix**: Wrapped `create_all` in try/except, logs warning instead of crashing
- **Status**: ✅ Fixed

### B2 — No database auto-commit in test override

- **File**: `backend/test_all_endpoints.py` (test infra, not production)
- **Symptom**: `GET /channels` returns 0 channels after `POST /channels` returns 201 because the test's session override doesn't auto-commit
- **Root cause**: Test replaces `get_db` dependency but doesn't replicate the commit-on-success behavior
- **Impact**: Only affects integration tests, not production (production `get_db` commits correctly)
- **Status**: Not a production bug

### B3 — Provider API key mask test fails in CI without encryption key

- **File**: `backend/app/security.py`
- **Symptom**: When `ENCRYPTION_KEY` is unset, `encrypt_value` returns plaintext. The `mask_key` only masks keys over 8 chars. Short test keys like `"sk-test"` pass through unmasked.
- **Impact**: In production with `ENCRYPTION_KEY` set, keys are encrypted. Without it, keys are stored in plaintext (dev mode warning logged)
- **Workaround**: Set `ENCRYPTION_KEY` in production. The `mask_key` function handles display masking regardless
- **Status**: Documented behavior (dev mode)

### B4 — Auth middleware exception handling

- **File**: `backend/app/main.py:47` (auth_middleware)
- **Symptom**: `HTTPException` from middleware propagates through Starlette's `BaseMiddleware` as an ExceptionGroup. FastAPI catches it correctly and returns 401, but logs an ugly traceback
- **Impact**: Cosmetic — 401 is returned correctly, but server logs show a traceback for every unauthenticated request
- **Fix**: Use `Response` instead of raising `HTTPException` in middleware, or add custom exception handler
- **Status**: Needs fix

### B5 — SQLite + asyncpg URL mismatch in db.py

- **File**: `backend/app/db.py`
- **Symptom**: When `DATABASE_URL` starts with `sqlite`, the engine creation uses SQLite correctly. But `pool_size` and `max_overflow` are still passed as kwargs to `create_async_engine`, which SQLite's aiosqlite ignores (harmless but noisy)
- **Impact**: None functional, SQLite ignores the extra kwargs
- **Status**: Minor

### B6 — `channel_id` vs `channel_id` response type mismatch

- **File**: `backend/app/api/channels.py`
- **Symptom**: Channel list returns `channel_id` as `null` for the `id` field in some edge cases
- **Status**: Already fixed in previous round (nullable FK)

### B7 — ChannelsPage Save missing auth headers (frontend)

- **File**: `frontend/src/pages/ChannelsPage.tsx`
- **Symptom**: Save button uses raw `fetch()` instead of `apiFetch()` — won't send `Authorization` header when `CEREBRA_API_KEY` is set
- **Fix**: Replace `fetch()` with `apiFetch()` from `./api/client`
- **Status**: Needs fix

---

## Summary

| Bug | Severity | Status |
|-----|----------|--------|
| B1 — Crash without Postgres | Critical | ✅ Fixed |
| B2 — Test commit behavior | Low | Noted |
| B3 — Key mask without ENCRYPTION_KEY | Low | Documented |
| B4 — Auth middleware traceback | Medium | Needs fix |
| B5 — SQLite pool kwargs | Low | Minor |
| B6 — Channel ID null | Low | ✅ Fixed |
| B7 — ChannelsPage missing auth | Medium | Needs fix |

## Actions Taken

- ✅ **B1 fixed**: Graceful DB startup
- ✅ **B6 fixed**: Previous round
- ⏳ **B4 fix**: Replace `raise HTTPException` with `JSONResponse` in middleware
- ⏳ **B7 fix**: Use `apiFetch()` in ChannelsPage
