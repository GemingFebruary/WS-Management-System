@echo off
chcp 65001 >nul
title 勤工助学管理系统 - 停止所有服务

echo ============================================
echo    勤工助学管理系统 - 停止所有服务
echo ============================================
echo.

:: 停止Python Flask进程
echo [停止] 正在关闭 Flask 后端 (端口 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

:: 停止Vue前端进程
echo [停止] 正在关闭 Vue 前端 (端口 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo ============================================
echo    所有服务已停止
echo ============================================
echo.

timeout /t 2 /nobreak >nul
