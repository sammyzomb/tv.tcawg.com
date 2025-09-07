@echo off
title 🚀 旅遊頻道管理系統 - 工作啟動器
color 0A

echo.
echo ========================================
echo    🚀 旅遊頻道管理系統工作啟動器
echo ========================================
echo.
echo 選擇要執行的操作:
echo.
echo 1. 自動載入工作指南 (推薦)
echo 2. 直接開啟管理系統
echo 3. 查看進度記錄
echo 4. 檢查 Git 狀態
echo 5. 退出
echo.
set /p choice="請輸入選項 (1-5): "

if "%choice%"=="1" (
    echo.
    echo 正在執行自動載入工作指南...
    call auto-load-guide.bat
) else if "%choice%"=="2" (
    echo.
    echo 正在開啟管理系統...
    start admin-calendar-unified.html
    echo ✅ 管理系統已開啟！
) else if "%choice%"=="3" (
    echo.
    echo 正在開啟進度記錄...
    start notepad NEXT_SESSION_GUIDE.md
    start notepad CONTENTFUL_SYNC_PROGRESS.md
    echo ✅ 進度記錄已開啟！
) else if "%choice%"=="4" (
    echo.
    echo 正在檢查 Git 狀態...
    git status
    echo.
    echo 最近的提交記錄:
    git log --oneline -5
) else if "%choice%"=="5" (
    echo.
    echo 再見！👋
    exit
) else (
    echo.
    echo ❌ 無效選項，請重新選擇
    pause
    goto :eof
)

echo.
pause


