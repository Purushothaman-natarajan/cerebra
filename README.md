<div align="center">

# Cerebra‑AI

**AI Agent Orchestration Platform**

Multi-agent workflows · Visual canvas · Multi-LLM · Custom tools · Telegram

[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](docs/ARCHITECTURE.md)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](docs/ARCHITECTURE.md)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](docs/ARCHITECTURE.md)

</div>

## Quick Start

**Windows:** `scripts\reset_and_start.bat`
**macOS / Linux:** `./scripts/run.sh`

Then open **http://localhost:5173** (frontend) · http://localhost:8000 (API) · http://localhost:8000/docs (Swagger)

---

## Features

| | Feature | Details |
|---|---------|---------|
| 🧠 | **Multi-LLM** | OpenAI, Gemini, Anthropic, Ollama, OpenRouter |
| 🤖 | **Agent Builder** | System prompt, tools, conversation memory, guardrails |
| 🔀 | **Visual Canvas** | ReactFlow drag-and-drop with 5 node types |
| 🔧 | **13 Built-in Tools** | Search, crawl, calculator, code, CVE lookup, JSON, text |
| 📡 | **Telegram Bots** | Connect bots to trigger workflows via webhook |
| 📋 | **Pre-built Templates** | 10 agent presets + 4 workflow blueprints |
| 🔒 | **Encrypted at Rest** | API keys encrypted with Fernet + PBKDF2 |

---

## Documentation

- **[Architecture](docs/ARCHITECTURE.md)** — system design, data flow, scaling
- **[API Reference](docs/API_DOCS.md)** — all endpoints with request/response examples
- **[Contributing](docs/CONTRIBUTING.md)** — coding standards, PR workflow
- **[Deployment](docs/DEPLOYMENT.md)** — Docker, env vars, production setup
- **[Developer Guide](docs/DEVELOPER_GUIDE.md)** — adding tools, agents, channels, providers
- **[Security](docs/SECURITY.md)** — authentication, encryption, best practices
- **[Changelog](docs/CHANGELOG.md)** — version history

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, ReactFlow, Tailwind CSS |
| Backend | Python 3.13, FastAPI, SQLAlchemy 2.0, LangGraph |
| Database | PostgreSQL 16 (asyncpg) / SQLite (dev) |
| Cache | Redis 7 (pub/sub with in-memory fallback) |
| LLM Runtime | OpenAI, Gemini, Anthropic, Ollama, OpenRouter |
