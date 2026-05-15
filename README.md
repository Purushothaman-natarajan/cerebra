# Cerebra‑AI

AI Agent Orchestration Platform — multi-agent workflows with a visual canvas, multi-LLM provider support, custom tool building, Telegram integration, and a template library.

## Quick Start

```bash
cp .env.example .env          # add your GEMINI_API_KEY
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs** (Swagger): http://localhost:8000/docs

## Documentation

| Document | Description |
|----------|-------------|
| [README (full)](docs/README.md) | Complete project overview, architecture, features, setup |
| [ARCHITECTURE](docs/ARCHITECTURE.md) | System architecture, data flow, design decisions |
| [API_DOCS](docs/API_DOCS.md) | Full API reference with request/response examples |
| [CONTRIBUTING](docs/CONTRIBUTING.md) | Coding standards, PR workflow, review checklist |
| [CHANGELOG](docs/CHANGELOG.md) | Version history |
| [DEPLOYMENT](docs/DEPLOYMENT.md) | Production deployment guide |
| [DEVELOPER_GUIDE](docs/DEVELOPER_GUIDE.md) | Setup, testing, adding tools/channels/providers |
| [SECURITY](docs/SECURITY.md) | Security policy, vulnerability reporting |

## Local Development

**Windows:**
```powershell
.\scripts\run.ps1          # PowerShell 7+
scripts\run.bat            # CMD
scripts\reset_and_start.bat  # Reset + restart
```

**macOS / Linux:**
```bash
./scripts/run.sh
```

**Manual:**
```bash
cd backend && DATABASE_URL=sqlite+aiosqlite:///./cerebra.db uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, ReactFlow, Tailwind CSS |
| Backend | Python 3.13, FastAPI, SQLAlchemy 2.0, LangGraph |
| Database | PostgreSQL 16 (asyncpg) / SQLite (dev) |
| Cache | Redis 7 (pub/sub, with in-memory fallback) |
| LLM | OpenAI, Gemini, Anthropic, Ollama, OpenRouter |
