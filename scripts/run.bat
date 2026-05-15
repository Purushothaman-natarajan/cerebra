@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0.."

echo.
echo === Cerebra - One Click Run ===
echo.

:: ── Check prerequisites ─────────────────────────────────────────────
where uv >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing uv package manager...
    powershell -c "irm https://astral.sh/uv/install.ps1 | iex" 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Could not install uv. Install manually: https://docs.astral.sh/uv/
        pause
        exit /b 1
    )
)
echo [OK] uv found

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

:: ── .env file ───────────────────────────────────────────────────────
if not exist .env (
    copy .env.example .env >nul
    echo [INFO] Created .env from .env.example — add your GEMINI_API_KEY
)

:: ── Start Docker services ───────────────────────────────────────────
where docker >nul 2>nul
if %errorlevel% equ 0 (
    echo [INFO] Starting Postgres + Redis...
    docker compose up postgres redis -d 2>nul
    if !errorlevel! equ 0 ( echo [OK] Database services started ) else ( echo [WARN] Docker not running — need postgres/redis externally )
)

:: ── Backend setup ───────────────────────────────────────────────────
echo [INFO] Setting up backend...
cd backend

if not exist .venv (
    uv venv >nul 2>&1
)
uv sync >nul 2>&1
if %errorlevel% neq 0 (
    uv pip install -r requirements.txt >nul 2>&1
)
echo [OK] Backend dependencies ready

echo [INFO] Starting backend on port 8000...
start "cerebra-backend" cmd /c "set DATABASE_URL=sqlite+aiosqlite:///./cerebra.db && set CEREBRA_API_KEY= && cd /d %~dp0..\backend && .venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
cd ..

echo [INFO] Waiting for backend...
set ready=0
for /l %%i in (1,1,30) do (
    >nul 2>&1 powershell -c "try { $r = Invoke-WebRequest -Uri http://localhost:8000/health -UseBasicParsing -TimeoutSec 2; $r.StatusCode -eq 200 } catch { $false }"
    if not errorlevel 1 (
        set ready=1
        goto :backend_ready
    )
    timeout /t 1 /nobreak >nul
)
:backend_ready
if !ready! equ 1 ( echo [OK] Backend ready ) else ( echo [WARN] Backend might not be ready yet )

:: ── Frontend setup ──────────────────────────────────────────────────
echo [INFO] Setting up frontend...
cd frontend
call npm install >nul 2>&1

echo [INFO] Starting frontend on port 5173...
start "cerebra-frontend" cmd /c "npm run dev"
cd ..

timeout /t 3 /nobreak >nul

:: ── Open browser ────────────────────────────────────────────────────
echo [OK] Opening browser...
start http://localhost:5173

echo.
echo ============================================
echo  Cerebra is running!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo ============================================
echo.
echo Close this window to stop the servers.
echo.

pause >nul

:: ── Cleanup ─────────────────────────────────────────────────────────
echo [INFO] Shutting down...
taskkill /f /fi "WINDOWTITLE eq cerebra-backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq cerebra-frontend" >nul 2>&1
echo [OK] Stopped
