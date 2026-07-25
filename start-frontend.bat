@echo off
title Frontend Server

echo Starting frontend...
cd /d "%~dp0"
set API_BASE_URL=http://127.0.0.1:4000
npm run dev

pause
