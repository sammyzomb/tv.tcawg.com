# 雲端硬碟同步指南

## 📁 使用 Google Drive / OneDrive / Dropbox

### 第一步：準備檔案

1. **壓縮專案資料夾**
   - 右鍵點擊 `travel-video-site` 資料夾
   - 選擇 "壓縮" 或 "建立壓縮檔"
   - 命名為 `travel-video-site-backup.zip`

2. **上傳到雲端硬碟**
   - 開啟您的雲端硬碟
   - 拖拽壓縮檔到雲端硬碟
   - 等待上傳完成

### 第二步：在工作電腦下載

1. **下載檔案**
   - 在工作電腦開啟雲端硬碟
   - 下載 `travel-video-site-backup.zip`

2. **解壓縮**
   - 右鍵點擊壓縮檔
   - 選擇 "解壓縮到..."
   - 選擇合適的資料夾位置

3. **啟動網站**
   ```bash
   cd travel-video-site
   python -m http.server 8000
   ```

## 🔄 後續同步

### 每日同步流程：

1. **下班前（目前電腦）**
   - 壓縮整個專案資料夾
   - 上傳到雲端硬碟
   - 覆蓋舊檔案

2. **上班時（工作電腦）**
   - 下載最新壓縮檔
   - 解壓縮覆蓋舊檔案
   - 啟動網站測試

## 📋 同步檢查清單

### 必須同步的檔案：
- [ ] `index.html`
- [ ] `script.js`
- [ ] `style.css`
- [ ] `admin-login.html`
- [ ] `admin-dashboard.html`
- [ ] `admin-schedule.html`
- [ ] `admin-calendar.html`
- [ ] `contentful-api.js`
- [ ] `schedule.json`
- [ ] 所有 `.md` 說明檔案

### 可選同步檔案：
- [ ] `logo.png`
- [ ] 其他圖片資源
- [ ] 測試資料檔案

## ⚠️ 注意事項

1. **檔案大小限制**
   - 確保壓縮檔小於雲端硬碟限制
   - 移除不必要的測試檔案

2. **版本管理**
   - 保留幾個版本的備份
   - 標註日期和版本號

3. **資料安全**
   - 不要上傳包含密碼的檔案
   - 檢查 API 金鑰是否安全

## 🚨 緊急備用方案

如果雲端硬碟無法使用：

1. **使用 USB 隨身碟**
   - 複製整個專案資料夾
   - 手動傳輸到工作電腦

2. **使用電子郵件**
   - 將重要檔案作為附件發送
   - 分批發送大型檔案

3. **使用檔案傳輸服務**
   - WeTransfer
   - Google Drive 分享連結
   - Dropbox 分享連結

