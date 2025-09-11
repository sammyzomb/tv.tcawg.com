Write-Host "🚀 啟動本地伺服器..." -ForegroundColor Green
Write-Host ""
Write-Host "請在瀏覽器中開啟: http://localhost:8000" -ForegroundColor Yellow
Write-Host "按 Ctrl+C 停止伺服器" -ForegroundColor Yellow
Write-Host ""

# 檢查是否有 Python
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server 8000
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    python3 -m http.server 8000
} else {
    Write-Host "❌ 未找到 Python，請安裝 Python 或使用其他方法" -ForegroundColor Red
    Write-Host "或者使用 Node.js: npx http-server -p 8000" -ForegroundColor Yellow
    pause
}
