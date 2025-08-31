# 🔄 同步檢查清單

## 📋 同步前檢查

### ✅ 核心網站檔案
- [ ] `index.html` - 主頁面
- [ ] `script.js` - 主要 JavaScript 功能
- [ ] `style.css` - 網站樣式
- [ ] `logo.png` - 網站標誌
- [ ] `schedule.json` - 預設節目表資料

### ✅ 管理後台檔案
- [ ] `admin-login.html` - 管理員登入頁面
- [ ] `admin-dashboard.html` - 管理儀表板
- [ ] `admin-schedule.html` - 節目表管理系統
- [ ] `admin-calendar.html` - 月曆節目管理系統

### ✅ API 和設定檔案
- [ ] `contentful-api.js` - Contentful API 整合
- [ ] `media.js` - 媒體處理功能
- [ ] `featured.js` - 精選節目功能
- [ ] `upnext.js` - 下一個節目功能

### ✅ 說明文件
- [ ] `README.md` - 專案說明
- [ ] `QUICK_LAUNCH_GUIDE.md` - 快速啟動指南
- [ ] `CONTENTFUL_SETUP.md` - Contentful 設定指南
- [ ] `GITHUB_SYNC_GUIDE.md` - GitHub 同步指南
- [ ] `CLOUD_SYNC_GUIDE.md` - 雲端同步指南
- [ ] `SYNC_CHECKLIST.md` - 本檢查清單

### ✅ 資料檔案
- [ ] `schedule.json` - 節目表資料
- [ ] `featured_updated.json` - 精選節目資料
- [ ] `hero.json` - 首頁橫幅資料
- [ ] `program.json` - 節目資料
- [ ] `videos.json` - 影片資料

## 🚨 重要提醒

### 不要同步的檔案：
- [ ] `.git/` 資料夾（如果使用 Git）
- [ ] `node_modules/` 資料夾（如果有）
- [ ] 包含密碼的設定檔案
- [ ] 個人測試檔案

### 需要特別注意的檔案：
- [ ] 檢查 `contentful-api.js` 中的 API 金鑰是否安全
- [ ] 確認沒有硬編碼的密碼
- [ ] 檢查是否有個人資訊

## 🔧 工作電腦設定檢查

### 必要軟體：
- [ ] Python 3.x 已安裝
- [ ] 網頁瀏覽器（Chrome/Firefox）
- [ ] 文字編輯器（VS Code/Notepad++）

### 測試步驟：
1. [ ] 解壓縮檔案到工作資料夾
2. [ ] 開啟終端機/命令提示字元
3. [ ] 導航到專案資料夾
4. [ ] 執行 `python -m http.server 8000`
5. [ ] 開啟瀏覽器訪問 `http://localhost:8000`
6. [ ] 測試主頁面功能
7. [ ] 測試管理後台登入
8. [ ] 測試節目表管理
9. [ ] 測試月曆節目管理
10. [ ] 測試歷史搜尋功能

## 📞 同步完成後

### 立即測試：
- [ ] 主頁面正常顯示
- [ ] 今日節目表功能正常
- [ ] 管理後台可以登入
- [ ] 可以添加/編輯節目
- [ ] 月曆功能正常運作
- [ ] 歷史搜尋功能正常

### 如果遇到問題：
1. 檢查檔案是否完整
2. 確認 Python 版本
3. 檢查埠號是否被占用
4. 查看瀏覽器控制台錯誤訊息

## 🎯 成功標準

當您在工作電腦上看到以下畫面時，表示同步成功：

✅ **主頁面**：顯示旅遊頻道標題和今日節目表
✅ **管理登入**：可以輸入帳號密碼登入
✅ **節目管理**：可以添加和編輯節目
✅ **月曆管理**：只顯示今天開始的日期
✅ **歷史搜尋**：可以搜尋過往節目記錄

---

**同步完成！** �� 您現在可以在工作電腦上繼續開發了。


