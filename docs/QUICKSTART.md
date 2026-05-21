# Quick Start

Get Cerebra running locally in minutes.

---

## Prerequisites

- **Git**
- **Python 3.12+**
- **Node.js 22+** and **npm**
- **Docker** (recommended) or **PostgreSQL 16** + **Redis 7**

---

## Option 1: Docker (recommended)

The fastest way to get everything running.

```bash
# 1. Clone
git clone https://github.com/Purushothaman-natarajan/cerebra.git
cd cerebra

# 2. Configure
cp .env.example .env
# Edit .env and set GEMINI_API_KEY (or add a provider via the UI later)

# 3. Start
docker compose up --build
```

Then open:

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |

---

## Option 2: Local Development

Run backend and frontend separately for faster iteration.

### 1. Clone

```bash
git clone https://github.com/Purushothaman-natarajan/cerebra.git
cd cerebra
cp .env.example .env
```

### 2. Backend

```bash
cd backend
uv venv
uv sync
# Or with pip: pip install -r requirements.txt

# Use SQLite for local dev (no Postgres needed)
set DATABASE_URL=sqlite+aiosqlite:///./cerebra.db   # Windows
export DATABASE_URL=sqlite+aiosqlite:///./cerebra.db # macOS/Linux

uv run uvicorn app.main:app --reload --port 8000
```

Verify: http://localhost:8000/health → `{"status":"healthy",...}`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at http://localhost:5173. API calls proxy to `localhost:8000`.

---

## Option 3: One-Command Scripts

For convenience, platform-specific scripts handle the full setup:

- **Windows**: `.\scripts\run.ps1`
- **macOS / Linux**: `./scripts/run.sh`

These scripts clone (if needed), install dependencies, and start both servers.

---

## What's Next?

Once running:

1. **Add a provider** — Go to the Providers page and add your API key (OpenAI, Gemini, Anthropic, or Ollama)
2. **Explore templates** — Browse pre-built workflow templates to see what's possible
3. **Build an agent** — Create an agent with a system prompt, tools, and guardrails
4. **Design a workflow** — Use the visual canvas to connect agents, routers, and outputs
5. **Run it** — Execute your workflow and inspect every step

---

## Need Help?

- [Architecture Overview](ARCHITECTURE.md) — System design and data flow
- [Development Guide](DEVELOPMENT.md) — Detailed setup for contributors
- [Deployment Guide](DEPLOYMENT.md) — Production deployment
- [Troubleshooting](TROUBLESHOOTING.md) — Common issues
