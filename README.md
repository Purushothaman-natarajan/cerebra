<div align="center">

# Cerebra‑AI

**AI Agent Orchestration Platform**

Multi-agent workflows · Visual canvas · Multi-LLM · Custom tools · Telegram integration

---

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)]()
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

---

</div>

<br>

<div align="center">

## Quick Start

<br>

```bash
cp .env.example .env          # add your GEMINI_API_KEY
docker compose up --build
```

<br>

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

</div>

<br>

---

## Documentation

| Document | Description |
|----------|-------------|
| [Full README](docs/README.md) | Complete project overview, architecture, features, setup |
| [Architecture](docs/ARCHITECTURE.md) | System architecture, data flow, design decisions |
| [API Docs](docs/API_DOCS.md) | Full API reference with request/response examples |
| [Contributing](docs/CONTRIBUTING.md) | Coding standards, PR workflow, review checklist |
| [Changelog](docs/CHANGELOG.md) | Version history |
| [Deployment](docs/DEPLOYMENT.md) | Production deployment guide |
| [Developer Guide](docs/DEVELOPER_GUIDE.md) | Setup, testing, adding tools/channels/providers |
| [Security](docs/SECURITY.md) | Security policy, vulnerability reporting |

---

## Local Development

**Windows**

```
scripts\reset_and_start.bat
```

**macOS / Linux**

```bash
./scripts/run.sh
```

**Manual**

```bash
cd backend && DATABASE_URL=sqlite+aiosqlite:///./cerebra.db uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, ReactFlow, Tailwind CSS |
| Backend | Python 3.13, FastAPI, SQLAlchemy 2.0, LangGraph |
| Database | PostgreSQL 16 (asyncpg) / SQLite (dev) |
| Cache | Redis 7 (pub/sub, in-memory fallback) |
| LLM | OpenAI, Gemini, Anthropic, Ollama, OpenRouter |

---

<div align="center">

<a href="docs/ARCHITECTURE.md">Architecture</a> ·
<a href="docs/API_DOCS.md">API</a> ·
<a href="docs/CONTRIBUTING.md">Contribute</a> ·
<a href="docs/SECURITY.md">Security</a>

</div>
