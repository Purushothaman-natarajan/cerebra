@echo off
cd /d "%~dp0"

echo Starting Orchid...
echo.

:: Start backend
cd backend
set DATABASE_URL=sqlite+aiosqlite:///./orchid.db
start "orchid-backend" cmd /c "python -m uvicorn app.main:app --port 8000 --reload"
cd ..

:: Start frontend
cd frontend
start "orchid-frontend" cmd /c "npm run dev"
cd ..

echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Close this window to stop.
pause
taskkill /f /fi "WINDOWTITLE eq orchid-backend" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq orchid-frontend" >nul 2>&1
echo Stopped.
