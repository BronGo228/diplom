@echo off
title Radio Inventory - Start

echo ========================================================
echo           Starting Radio Inventory System
echo ========================================================

cd /d "%~dp0"

echo [1/3] Setting up Backend (API)...
cd api
if exist venv goto SKIP_VENV
echo Creating python virtual environment...
python -m venv venv
:SKIP_VENV
call venv\Scripts\activate.bat
pip install -r requirements.txt >nul 2>&1
start "Radio Inventory API" cmd /c "title Radio Inventory API && .\venv\Scripts\python.exe main.py"
cd ..

echo.
echo [2/3] Setting up Frontend (Vite)...
cd frontend
if exist node_modules goto SKIP_NPM
echo Installing NPM packages, this may take a few minutes...
call npm install >nul 2>&1
:SKIP_NPM
start "Radio Inventory Frontend" cmd /c "title Radio Inventory Frontend && npm run dev"
cd ..

echo.
echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:5173

echo.
echo ========================================================
echo System is running!
echo To stop the servers, run stop_system.bat.
echo PLEASE DO NOT CLOSE the two black server windows. 
echo You can minimize them.
echo ========================================================
pause
