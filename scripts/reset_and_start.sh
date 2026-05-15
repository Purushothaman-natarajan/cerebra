#!/usr/bin/env bash
# ===========================================================================
# Cerebra-AI Complete Reset & Restart Script (Linux/macOS)
#
# Kills all stale processes, frees port 8000, removes temporary databases,
# and starts fresh.
# ===========================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/scripts/logs"
mkdir -p "$LOG_DIR"

echo ""
echo "=== Cerebra-AI Reset and Restart ==="
echo ""

# ── Step 1: Kill all Python/uvicorn processes ──────────────────────
echo "[1/5] Killing stale Python/uvicorn processes..."
pkill -f "uvicorn app.main" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
echo "  [OK] Processes killed"

# ── Step 2: Wait for port 8000 to be released ─────────────────────
echo "[2/5] Waiting for port 8000..."
for i in $(seq 1 10); do
    if ! curl -sf http://localhost:8000/health >/dev/null 2>&1; then
        break
    fi
    sleep 1
done
# Force kill anything still on port 8000
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2
echo "  [OK] Port 8000 cleared"

# ── Step 3: Clean temporary databases ───────────────────────────────
echo "[3/5] Cleaning temporary databases..."
cd "$ROOT_DIR/backend"
rm -f test_*.db cerebra.db test_backend.db alembic_migration.db
echo "  [OK] Temp databases removed"

# ── Step 4: Start backend ────────────────────────────────────────────
echo "[4/5] Starting backend on port 8000..."
cd "$ROOT_DIR/backend"
export DATABASE_URL="sqlite+aiosqlite:///./cerebra.db"
export GEMINI_API_KEY=""
export CEREBRA_API_KEY=""
export REDIS_URL=""

uv run uvicorn app.main:app --reload --port 8000 &>"$LOG_DIR/backend.log" &
BACKEND_PID=$!
echo "  [OK] Backend starting (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "  [WAIT] Waiting for backend..."
for i in $(seq 1 30); do
    sleep 1
    if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
        echo "  [OK] Backend ready at http://localhost:8000"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "  [WARN] Backend not ready after 30s — check $LOG_DIR/backend.log"
    fi
done

# ── Step 5: Start frontend ──────────────────────────────────────────
echo "[5/5] Starting frontend on port 5173..."
cd "$ROOT_DIR/frontend"
npm install 2>/dev/null
npm run dev &>"$LOG_DIR/frontend.log" &
FRONTEND_PID=$!
echo "  [OK] Frontend starting (PID: $FRONTEND_PID)"
sleep 3

echo ""
echo "============================================"
echo " Cerebra-AI is running!"
echo " Frontend: http://localhost:5173"
echo " Backend:  http://localhost:8000"
echo " API Docs: http://localhost:8000/docs"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop all services"

trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped'" EXIT
wait
