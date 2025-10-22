@echo off
echo Starting AIVA Dashboard and Ticket System...
echo.

echo Installing dependencies...
call npm install
cd ticket-system
call npm install
cd ..

echo.
echo Starting servers...
start "AIVA Dashboard" cmd /k "node server.js"
timeout /t 2 /nobreak >nul
start "Ticket System" cmd /k "cd ticket-system && node app.js"

echo.
echo Servers started:
echo - AIVA Dashboard: http://localhost:3000
echo - Ticket System: http://localhost:3001
echo.
pause