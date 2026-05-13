# Run Scripts

One-click scripts to start Cerebra locally.

## Quick Start

### Windows — Double-click

```
scripts\run.bat
```

Or from PowerShell:
```
.\scripts\run.ps1
```

### macOS / Linux

```bash
chmod +x scripts/run.sh
./scripts/run.sh
```

## What Each Script Does

| Script | Platform | How to Run | Features |
|--------|----------|-----------|----------|
| `run.bat` | Windows | Double-click in Explorer | Auto-installs uv, starts Docker deps, launches backend + frontend in background windows, opens browser, kills servers on window close |
| `run.ps1` | Windows | `.\scripts\run.ps1` in PowerShell | Same as bat but with PowerShell features. Supports `-NoDocker` and `-NoOpen` flags |
| `run.sh` | macOS/Linux | `./scripts/run.sh` in terminal | Same as ps1. Tabs, waits for health check, Ctrl+C cleanup |

## Flags

### PowerShell (`run.ps1`)
| Flag | Effect |
|------|--------|
| `-NoDocker` | Skip Docker Compose (assume Postgres/Redis running externally) |
| `-NoOpen` | Don't auto-open browser |

### Shell (`run.sh`)
| Flag | Effect |
|------|--------|
| `--no-docker` | Skip Docker Compose |
| `--no-open` | Don't auto-open browser |

## Prerequisites (auto-installed)

- **uv** — Python package manager (installed automatically if missing)
- **Node.js** — must be installed manually (https://nodejs.org/)
- **Docker** — optional, for Postgres + Redis

## Output

```
scripts/logs/
├── backend.log    # Backend uvicorn output
└── frontend.log   # Frontend Vite output
```
