#Requires -Version 7.0
param(
    [switch]$NoDocker,
    [switch]$NoOpen
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  ⚠ $msg" -ForegroundColor Yellow }

# ── Check prerequisites ──────────────────────────────────────────────
Write-Step "Checking prerequisites"

$hasUv = $null -ne (Get-Command "uv" -ErrorAction SilentlyContinue)
if (-not $hasUv) {
    Write-Host "uv not found. Install it: powershell -c `"irm https://astral.sh/uv/install.ps1 | iex`"" -ForegroundColor Yellow
    Write-Host "Or install manually: https://docs.astral.sh/uv/#installation" -ForegroundColor Yellow
    exit 1
}
Write-OK "uv found"

$hasNode = $null -ne (Get-Command "node" -ErrorAction SilentlyContinue)
if (-not $hasNode) {
    Write-Host "Node.js not found. Install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-OK "Node.js $($node --version)"

# ── Start Docker services (unless skipped) ───────────────────────────
$dockerRunning = $null -ne (Get-Command "docker" -ErrorAction SilentlyContinue)
if ($dockerRunning -and -not $NoDocker) {
    Write-Step "Starting Postgres + Redis via Docker"
    docker compose up postgres redis -d 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-OK "Postgres + Redis started"
    } else {
        Write-Warn "Docker compose failed — ensure Docker is running"
    }
} elseif (-not $dockerRunning) {
    Write-Warn "Docker not found — postgres/redis must be running externally"
}

# ── Install backend deps with uv ─────────────────────────────────────
Write-Step "Installing backend dependencies (uv)"
Push-Location "$rootDir\backend"
uv venv 2>$null
uv sync 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-OK "Backend deps installed"
} else {
    uv pip install -r requirements.txt 2>&1 | Out-Null
    Write-OK "Backend deps installed (pip fallback)"
}
Pop-Location

# ── Install frontend deps ────────────────────────────────────────────
Write-Step "Installing frontend dependencies"
Push-Location "$rootDir\frontend"
npm install 2>$null
Write-OK "Frontend deps installed"
Pop-Location

# ── Start backend ────────────────────────────────────────────────────
Write-Step "Starting backend"
$backendLog = "$rootDir\backend.log"
Push-Location "$rootDir\backend"
$backendJob = Start-Process -NoNewWindow -PassThru -FilePath (Get-Command "uv").Source -ArgumentList "run uvicorn app.main:app --reload --port 8000" -RedirectStandardOutput $backendLog -RedirectStandardError $backendLog
Pop-Location
Write-OK "Backend starting (PID: $($backendJob.Id)) — log: backend.log"

# Wait for backend to be ready
Write-Step "Waiting for backend..."
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {}
}
if ($ready) {
    Write-OK "Backend ready at http://localhost:8000"
} else {
    Write-Warn "Backend not ready after 30s — check backend.log"
}

# ── Start frontend ───────────────────────────────────────────────────
Write-Step "Starting frontend"
$frontendLog = "$rootDir\frontend.log"
Push-Location "$rootDir\frontend"
$frontendJob = Start-Process -NoNewWindow -PassThru -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendLog
Pop-Location
Write-OK "Frontend starting (PID: $($frontendJob.Id)) — log: frontend.log"

Start-Sleep -Seconds 3

$frontendUrl = "http://localhost:5173"
Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Cerebra is running!                        ║" -ForegroundColor Green
Write-Host "║  Frontend: $frontendUrl" -ForegroundColor Green
Write-Host "║  Backend:  http://localhost:8000             ║" -ForegroundColor Green
Write-Host "║  API Docs: http://localhost:8000/docs        ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Green

if (-not $NoOpen) {
    Start-Process $frontendUrl
}

Write-Host "`nPress Ctrl+C to stop all services" -ForegroundColor Gray

# ── Wait and cleanup ────────────────────────────────────────────────
try {
    while ($true) { Start-Sleep -Seconds 1 }
}
finally {
    Write-Step "Shutting down..."
    if ($backendJob -and -not $backendJob.HasExited) { $backendJob.Kill() }
    if ($frontendJob -and -not $frontendJob.HasExited) { $frontendJob.Kill() }
    Write-OK "Stopped"
}
