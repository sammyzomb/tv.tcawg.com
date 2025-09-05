@echo off
echo ========================================
echo 航向世界旅遊頻道 - 自動同步腳本
echo ========================================
echo.

echo [1/5] 檢查 Git 狀態...
git status
echo.

echo [2/5] 獲取最新變更...
git fetch origin
echo.

echo [3/5] 檢查本地與遠端差異...
git log --oneline -5
echo.
git log --oneline origin/main -5
echo.

echo [4/5] 拉取最新程式碼...
git pull origin main
echo.

echo [5/5] 檢查同步結果...
git status
echo.

echo ========================================
echo 同步完成！
echo ========================================
echo.
echo 請執行以下操作驗證：
echo 1. 重新開啟 index.html
echo 2. 按 Ctrl+Shift+R 強制重新整理
echo 3. 檢查是否顯示「目前暫無節目」卡片
echo.
echo 如果仍有問題，請使用 sync-checker.html 工具診斷
echo.

pause
