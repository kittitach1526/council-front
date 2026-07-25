@echo off
echo Installing dependencies...

echo [1/2] Installing backend Python packages...
cd /d "%~dp0\backend"
python -m pip install -r requirements.txt

echo.
echo [2/2] Installing frontend Node packages...
cd /d "%~dp0"
npm install

echo.
echo Installation complete!
echo Run start-all.bat to start both servers.
pause
