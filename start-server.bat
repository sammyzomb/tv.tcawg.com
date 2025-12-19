@echo off
echo ========================================
echo   啟動本地伺服器
echo ========================================
echo.
echo 正在啟動伺服器...
echo 請在瀏覽器中打開: http://localhost:8000
echo.
echo 按 Ctrl+C 可以停止伺服器
echo ========================================
echo.

cd /d "%~dp0"
python -m http.server 8000

pause

