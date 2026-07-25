@echo off
echo Starting backend and frontend servers...

echo [Backend] Starting on http://127.0.0.1:4000
start "Backend" cmd /k "cd /d \"%~dp0\" && call start-backend.bat"

echo [Frontend] Starting on http://localhost:3000
start "Frontend" cmd /k "cd /d \"%~dp0\" && call start-frontend.bat"

echo.
echo Both servers are starting in separate windows.
pause
