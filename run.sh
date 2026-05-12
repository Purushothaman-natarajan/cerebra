#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

step() { echo -e "\n==> $1"; }
ok()   { echo "  ✓ $1"; }
warn() { echo "  ⚠ $1"; }

# ── Check prerequisites ──────────────────────────────────────────────
step "Checking prerequisites"

if ! command -v uv &>/dev/null; then
    echo "uv not found. Install: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi
ok "uv found"

if ! command -v node &>/dev/null; then
    echo "Node.js not found. Install from https://nodejs.org/"
    exit 1
fi
ok "Node.js $(node --version)"

# ── Start Docker services ────────────────────────────────────────────
if command -v docker &>/dev/null; then
    step "Starting Postgres + Redis via Docker"
    docker compose up postgres redis -d 2>/dev/null && ok "Postgres + Redis started" || warn "Docker compose failed"
else
    warn "Docker not found — ensure postgres/redis are running externally"
fi

# ── Install backend deps ─────────────────────────────────────────────
step "Installing backend dependencies (uv)"
cd "$ROOT_DIR/backend"
uv venv 2>/dev/null
uv sync 2>/dev/null && ok "Backend deps installed" || {
    uv pip install -r requirements.txt && ok "Backend deps installed (pip fallback)"
}

# ── Install frontend deps ────────────────────────────────────────────
step "Installing frontend dependencies"
cd "$ROOT_DIR/frontend"
npm install 2>/dev/null
ok "Frontend deps installed"

# ── Start backend ────────────────────────────────────────────────────
step "Starting backend"
cd "$ROOT_DIR/backend"
uv run uvicorn app.main:app --reload --port 8000 &>/tmp/cerebra-backend.log &
BACKEND_PID=$!
ok "Backend starting (PID: $BACKEND_PID) — tail -f /tmp/cerebra-backend.log"

# Wait for backend
step "Waiting for backend..."
for i in $(seq 1 30); do
    sleep 1
    curl -sf http://localhost:8000/health >/dev/null 2>&1 && { ok "Backend ready at http://localhost:8000"; break; }
    if [ "$i" -eq 30 ]; then warn "Backend not ready after 30s — check /tmp/cerebra-backend.log"; fi
done

# ── Start frontend ───────────────────────────────────────────────────
step "Starting frontend"
cd "$ROOT_DIR/frontend"
npm run dev &>/tmp/cerebra-frontend.log &
FRONTEND_PID=$!
ok "Frontend starting (PID: $FRONTEND_PID) — tail -f /tmp/cerebra-frontend.log"
sleep 3

FRONTEND_URL="http://localhost:5173"
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Cerebra is running!                        ║"
echo "║  Frontend: $FRONTEND_URL"
echo "║  Backend:  http://localhost:8000             ║"
echo "║  API Docs: http://localhost:8000/docs        ║"
echo "╚══════════════════════════════════════════════╝"

# Open browser
case "$(uname -s)" in
    Linux)   xdg-open "$FRONTEND_URL" 2>/dev/null ;;
    Darwin)  open "$FRONTEND_URL" 2>/dev/null ;;
esac

echo -e "\nPress Ctrl+C to stop all services"

# ── Cleanup on exit ──────────────────────────────────────────────────
trap "echo ''; step 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; ok 'Stopped'" EXIT
wait
