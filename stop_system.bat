@echo off
title Radio Inventory - Stop

echo ========================================================
echo         Stopping Radio Inventory System
echo ========================================================

echo 1. Closing Server Windows by Title...
taskkill /F /FI "WINDOWTITLE eq Radio Inventory API*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Radio Inventory Frontend*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq npm*" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Vite*" /T >nul 2>&1

echo 2. Terminating running Python/Node processes by Command Line...
powershell -Command "try { Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match 'main\.py' -or $_.CommandLine -match 'vite' -or $_.CommandLine -match 'npm run dev' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue } } catch {}" >nul 2>&1

echo 3. Freeing up ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a /T >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a /T >nul 2>&1
)

echo.
echo ========================================================
echo System and all servers have been successfully stopped!
echo You can close this window.
echo ========================================================
timeout /t 3 >nul
