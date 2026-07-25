@echo off
title Backend Server

echo Starting backend...
cd /d "%~dp0\backend"
python app.py

pause
