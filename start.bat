@echo off
chcp 65001 >nul
title 勤工助学管理系统 - 一键启动

echo ============================================
echo    勤工助学管理系统 - 一键启动脚本
echo ============================================
echo.

:: 检查Python是否安装
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到Python，请先安装Python 3.8+
    pause
    exit /b 1
)

:: 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js 16+
    pause
    exit /b 1
)

echo [信息] Python 和 Node.js 环境检测通过
echo.

:: 设置项目根目录
set "ROOT_DIR=%~dp0"
set "PY_DIR=%ROOT_DIR%QGPY"
set "WEB_DIR=%ROOT_DIR%QGWEB"

:: 检查QGPY目录是否存在
if not exist "%PY_DIR%\run.py" (
    echo [警告] QGPY后端目录不存在或缺少run.py，跳过后端启动
    set "SKIP_PY=1"
) else (
    set "SKIP_PY=0"
)

:: 检查QGWEB目录是否存在
if not exist "%WEB_DIR%\package.json" (
    echo [警告] QGWEB前端目录不存在或缺少package.json，跳过前端启动
    set "SKIP_WEB=1"
) else (
    set "SKIP_WEB=0"
)

echo ============================================
echo    正在启动服务...
echo ============================================
echo.

:: 启动Python后端 (新窗口)
if "%SKIP_PY%"=="0" (
    echo [启动] Python Flask 后端 -> http://localhost:5000
    start "QGPY-Flask后端" cmd /k "cd /d "%PY_DIR%" && python run.py"
) else (
    echo [跳过] Python Flask 后端
)

:: 等待2秒让后端先启动
timeout /t 2 /nobreak >nul

:: 启动Vue前端 (新窗口)
if "%SKIP_WEB%"=="0" (
    echo [启动] Vue 前端 -> http://localhost:3001
    start "QGWEB-Vue前端" cmd /k "cd /d "%WEB_DIR%" && npm run dev"
) else (
    echo [跳过] Vue 前端
)

echo.
echo ============================================
echo    启动完成！
echo ============================================
echo.
echo    Flask 后端: http://localhost:5000
echo    Vue  前端: http://localhost:3001
echo    健康检查:  http://localhost:5000/health
echo.
echo    提示: 关闭此窗口不会停止服务
echo          请在各服务窗口中按 Ctrl+C 停止
echo ============================================
echo.

pause
