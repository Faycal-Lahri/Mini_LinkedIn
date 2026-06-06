@echo off
title Miniii Link - Startup Script
echo ====================================================
echo          DEMARRAGE DE MINIII LINK SYSTEM
echo ====================================================
echo.

:: 1. Demarrage du Backend Laravel avec PHP 8.2
echo [+] Lancement du Backend Laravel (Port 8000)...
start "Miniii Link - Backend API" cmd /k "cd backend && php artisan serve --port=8000"

:: 2. Demarrage du Frontend React + Vite
echo [+] Lancement du Frontend React + Vite (Port 5173)...
start "Miniii Link - Frontend Web" cmd /k "cd frontend && npm run dev"

echo.
echo ====================================================
echo Les deux serveurs sont en cours de demarrage...
echo Ouverture automatique de votre navigateur...
echo ====================================================
timeout /t 3 >nul
start http://localhost:5173

exit
