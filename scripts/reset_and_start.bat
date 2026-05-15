@echo off
REM ===========================================================================
REM Cerebra-AI Complete Reset & Restart Script (Windows)
REM
USE: Double-click or run from terminal. Kills all stale processes,
REM   frees port 8000, removes temporary databases, and starts fresh.
REM ===========================================================================
setlocal enabledelayedexpansion

echo.
echo === Cerebra-AI Reset and Restart ===
echo.

REM ── Step 1: Kill ALL Python and uvicorn processes ──────────────────────
echo [1/6] Killing stale Python/uvicorn processes...
taskkill /f /im uvicorn.exe >nul 2>&1
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im python3.13.exe >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq cerebra-backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq cerebra-frontend" >nul 2>&1
echo  [OK] Process killed

REM ── Step 2: Wait for port release ─────────────────────────────────────
echo [2/6] Waiting for port 8000 to be released...
timeout /t 5 /nobreak >nul

REM If port is still held, find and kill by PID
netstat -ano | findstr ":8000.*LISTENING" >nul 2>&1
if !errorlevel! equ 0 (
    echo  [WARN] Port 8000 still in use - force clearing...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do (
        echo  Killing PID %%a
        taskkill /pid %%a /f >nul 2>&1
    )
    timeout /t 3 /nobreak >nul
)
echo  [OK] Port 8000 cleared

REM ── Step 3: Clean temporary databases ──────────────────────────────────
echo [3/6] Cleaning temporary databases...
cd /d "%~dp0..\backend"
del /q /f test_*.db orchid.db test_backend.db alembic_migration.db 2>nul
echo  [OK] Temp databases removed

REM ── Step 4: Check .env file ────────────────────────────────────────────
echo [4/6] Checking .env configuration...
cd /d "%~dp0.."
if not exist .env (
    copy .env.example .env >nul
    echo  [INFO] Created .env from .env.example - add your GEMINI_API_KEY
) else (
    echo  [OK] .env exists
)

REM ── Step 5: Start backend ─────────────────────────────────────────────
echo [5/6] Starting backend on port 8000...
cd /d "%~dp0..\backend"
if not exist .venv (
    echo  [INFO] Creating virtual environment...
    python -m venv .venv
)
set DATABASE_URL=sqlite+aiosqlite:///./orchid.db
set GEMINI_API_KEY=
set CEREBRA_API_KEY=
set REDIS_URL=

start "cerebra-backend" cmd /c "uvicorn app.main:app --reload --port 8000"

REM Wait for backend to be ready
echo  [WAIT] Waiting for backend to start...
set ready=0
for /l %%i in (1,1,30) do (
    >nul 2>&1 powershell -c "try { (Invoke-WebRequest -Uri http://localhost:8000/health -UseBasicParsing).StatusCode -eq 200 } catch { $false }"
    if not errorlevel 1 (
        set ready=1
        goto :backend_ready
    )
    timeout /t 1 /nobreak >nul
)
:backend_ready
if !ready! equ 1 (
    echo  [OK] Backend ready at http://localhost:8000
) else (
    echo  [WARN] Backend may not be ready - check backend window
)

REM ── Step 6: Start frontend ────────────────────────────────────────────
echo [6/6] Starting frontend on port 5173...
cd /d "%~dp0..\frontend"
call npm install >nul 2>&1
start "cerebra-frontend" cmd /c "npm run dev"

timeout /t 3 /nobreak >nul

REM ── Done ──────────────────────────────────────────────────────────────
cd /d "%~dp0.."
echo.
echo ============================================
echo  Cerebra-AI is running!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo ============================================
echo.
echo Close the backend/frontend CMD windows to stop.
echo Or run: taskkill /f /fi "WINDOWTITLE eq cerebra-backend"
echo.

REM Open browser
start http://localhost:5173

endlocal
