# 🚀 下次登入自動載入工作指南
# 建立日期: 2025年1月3日

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🚀 歡迎回來！自動載入工作指南" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📅 日期: $(Get-Date -Format 'yyyy-MM-dd')" -ForegroundColor Green
Write-Host "⏰ 時間: $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 當前狀態: Contentful 同步功能修復已完成，等待測試驗證" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚡ 立即行動清單:" -ForegroundColor Red
Write-Host ""
Write-Host "1. 測試 Contentful 同步功能 (優先級：高)" -ForegroundColor White
Write-Host "   - 開啟 admin-calendar-unified.html" -ForegroundColor Gray
Write-Host "   - 按 F12 打開開發者工具" -ForegroundColor Gray
Write-Host "   - 點擊「🔄 同步到 Contentful」按鈕" -ForegroundColor Gray
Write-Host "   - 觀察結果和錯誤訊息" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 如果同步成功" -ForegroundColor White
Write-Host "   - 驗證節目是否出現在 Contentful 中" -ForegroundColor Gray
Write-Host "   - 測試多個節目的批量上架" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 如果同步失敗" -ForegroundColor White
Write-Host "   - 複製錯誤訊息" -ForegroundColor Gray
Write-Host "   - 檢查 video 欄位設定" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 詳細說明請查看: NEXT_SESSION_GUIDE.md" -ForegroundColor Cyan
Write-Host "📋 完整進度記錄: CONTENTFUL_SYNC_PROGRESS.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 等待用戶確認
Read-Host "按 Enter 鍵繼續..."

Write-Host ""
Write-Host "正在開啟詳細說明檔案..." -ForegroundColor Green
Start-Process "notepad.exe" -ArgumentList "NEXT_SESSION_GUIDE.md"

Write-Host "正在開啟主要工作檔案..." -ForegroundColor Green
Start-Process "admin-calendar-unified.html"

Write-Host ""
Write-Host "✅ 檔案已開啟，可以開始工作了！" -ForegroundColor Green
Write-Host ""

# 顯示 Git 狀態
Write-Host "📊 當前 Git 狀態:" -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "🔍 最近的提交記錄:" -ForegroundColor Yellow
git log --oneline -3

Write-Host ""
Read-Host "按 Enter 鍵結束..."


