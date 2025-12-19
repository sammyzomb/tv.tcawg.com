# PowerShell 腳本：啟動本地伺服器
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  啟動本地伺服器" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "正在啟動伺服器..." -ForegroundColor Yellow
Write-Host "請在瀏覽器中打開: http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 可以停止伺服器" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 切換到腳本所在目錄
Set-Location $PSScriptRoot

# 啟動 Python HTTP 伺服器
python -m http.server 8000





