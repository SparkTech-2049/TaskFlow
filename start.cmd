@echo off
chcp 65001 >nul 2>&1
title TaskFlow Dev Server

echo [1/2] Killing existing node processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/2] Starting dev server...
echo.
echo ========================================
echo   TaskFlow running at http://localhost:3000
echo   Press Ctrl+C to stop
echo ========================================
echo.
set NODE_TLS_REJECT_UNAUTHORIZED=0
npx next dev
