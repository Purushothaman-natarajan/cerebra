# Scripts

| Script | Platform | Purpose |
|--------|----------|---------|
| `run.sh` | Linux/macOS | One-click start: installs deps, starts backend + frontend |
| `reset_and_start.sh` | Linux/macOS | Force-reset: kills processes, cleans DBs, then starts fresh |
| `reset_and_start.bat` | Windows | Force-reset + restart. Handles zombie port issues on Windows |
| `run.bat` | Windows | Simple one-click start (use `reset_and_start.bat` if port issues) |
| `pre_commit_secret_scan.py` | Cross-platform | Pre-commit hook — auto-run by `.pre-commit-config.yaml`. Scans staged files for hardcoded secrets |

## Quick start

**Linux/macOS:**
```bash
./scripts/run.sh
```

**Windows (CMD):**
```cmd
scripts\reset_and_start.bat
```

## Reset (for port issues)

If you get "address already in use" or the frontend shows `ECONNREFUSED`:

**Linux/macOS:**
```bash
./scripts/reset_and_start.sh
```

**Windows:**
```cmd
scripts\reset_and_start.bat
```
