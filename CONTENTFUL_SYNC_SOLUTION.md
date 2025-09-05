# 🔄 Contentful 節目同步解決方案

## 🎯 **問題描述**
您在家裡電腦上架的節目，在公司電腦的管理員介面中看不到，這是因為：
1. 節目資料儲存在 `localStorage` 中，不同電腦的 `localStorage` 是獨立的
2. 系統沒有正確從 Contentful 載入已上架的節目

## ✅ **解決方案**
我已經修正了 `admin-calendar-unified.html` 統一節目管理系統，現在會：

### 1. **自動從 Contentful 載入節目**
- 系統啟動時會自動嘗試從 Contentful 載入節目
- 如果 Contentful 沒有資料，會降級到 localStorage
- 支援多種 Contentful 內容類型：`scheduleItem`、`program`、`videoAsset`、`programTemplate`

### 2. **新增重新載入按鈕**
- 在管理介面右上角新增了「📥 從 Contentful 重新載入」按鈕
- 可以手動重新載入 Contentful 中的最新節目資料

### 3. **智能資料轉換**
- 自動將 Contentful 的資料格式轉換為本地格式
- 支援中文字段名稱（如：`節目標題`、`播出日期` 等）
- 自動按時間排序節目

## 🚀 **使用方法**

### 在公司電腦上：
1. 開啟 `admin-calendar-unified.html`
2. 系統會自動嘗試從 Contentful 載入節目
3. 如果沒有看到節目，點擊「📥 從 Contentful 重新載入」按鈕
4. 等待載入完成，應該就能看到家裡電腦上架的節目了

### 檢查載入狀態：
- 開啟瀏覽器開發者工具（F12）
- 查看 Console 標籤的訊息
- 應該會看到類似訊息：
  ```
  正在從 Contentful 載入節目...
  Contentful 連接成功，開始載入節目...
  從 Contentful 載入 X 天的節目
  ```

## 🔧 **技術細節**

### 修改的檔案：
1. **`admin-calendar-unified.html`**
   - 修改 `loadEvents()` 函數，優先從 Contentful 載入
   - 新增 `loadEventsFromContentful()` 函數
   - 新增 `reloadFromContentful()` 函數
   - 新增重新載入按鈕

2. **`contentful-sync-fixed.js`**
   - 新增 `getAllPrograms()` 方法
   - 支援多種內容類型載入
   - 增強錯誤處理

### 資料流程：
```
Contentful → getAllPrograms() → 資料轉換 → 本地 events 物件 → 日曆顯示
```

## 🚨 **故障排除**

### 如果還是看不到節目：

1. **檢查 Contentful 連接**
   - 開啟開發者工具 Console
   - 查看是否有錯誤訊息
   - 確認 Contentful Space ID 和 Access Token 正確

2. **手動重新載入**
   - 點擊「📥 從 Contentful 重新載入」按鈕
   - 等待載入完成

3. **檢查 Contentful 內容**
   - 登入 Contentful 管理介面
   - 確認有節目資料存在
   - 檢查內容類型是否正確

4. **調試模式**
   - 點擊「🔍 調試節目」按鈕
   - 查看 Console 中的詳細資訊

## 📋 **預期結果**

修正後，您應該能夠：
- ✅ 在公司電腦看到家裡電腦上架的節目
- ✅ 自動同步 Contentful 中的最新節目
- ✅ 手動重新載入節目資料
- ✅ 在月曆、週曆、日曆三種視圖中看到節目

## 🔄 **未來改進**

1. **自動同步**：可以設定定時自動同步
2. **衝突解決**：處理本地和 Contentful 資料衝突
3. **離線支援**：離線時使用本地快取
4. **即時更新**：使用 Contentful Webhooks 即時更新

---

**現在您可以在公司電腦上正常看到家裡電腦上架的節目了！** 🎉
