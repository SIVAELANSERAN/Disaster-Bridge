@echo off
cd /d "%~dp0backend"
if not exist node_modules\express (
  echo Installing required packages...
  call npm install
  if errorlevel 1 (
    echo.
    echo Installation failed. Make sure Node.js is installed.
    pause
    exit /b 1
  )
)
echo Starting Disaster Bridge...
start "Disaster Bridge - Browser" http://localhost:5000/
call npm start
pause
