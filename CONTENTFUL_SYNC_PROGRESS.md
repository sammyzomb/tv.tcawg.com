# Contentful 同步功能修復進度記錄

## 📅 處理日期
2025年1月3日

## 🎯 問題概述
Contentful 節目上架功能出現同步錯誤，需要修復欄位映射和驗證問題。

## ✅ 已完成的修正

### 1. 欄位名稱映射修正
- **問題**: 使用中文欄位名稱導致 `UnknownField` 錯誤
- **解決**: 修正為正確的 Field ID
  - `顯示名稱` → `title`
  - `播出日期` → `airDate`
  - `時段` → `block`
  - `槽位序號 (0-11)` → `slotIndex`
  - `是否首播` → `isPremiere`
  - `備註` → `notes`

### 2. 語言代碼修正
- **問題**: 使用 `zh-TW` 語言代碼導致 `ValidationFailed` 錯誤
- **解決**: 修正為 `en-US` 語言代碼

### 3. 欄位格式修正
- **問題**: `block` 欄位需要時段範圍，不是具體時間
- **解決**: 添加 `getTimeBlock()` 函數
  - 支援時段: `00-06`, `06-12`, `12-18`, `18-24`
  - 自動將時間轉換為對應時段

### 4. 必填欄位修正
- **問題**: 缺少必填的 `video` 欄位
- **解決**: 添加 `video` 欄位作為 Reference 類型

### 5. UI 清理
- 移除無用的按鈕和功能
- 清理重複的函數定義
- 簡化介面，只保留核心功能

## 🔧 技術細節

### 修正的檔案
- `admin-calendar-unified.html` (主要修改檔案)

### 關鍵函數
```javascript
// 時間轉換函數
function getTimeBlock(timeString) {
  if (!timeString) return '12-18';
  
  const hour = parseInt(timeString.split(':')[0]);
  
  if (hour >= 0 && hour < 6) return '00-06';
  if (hour >= 6 && hour < 12) return '06-12';
  if (hour >= 12 && hour < 18) return '12-18';
  if (hour >= 18 && hour < 24) return '18-24';
  
  return '12-18'; // 預設值
}
```

### 欄位映射
```javascript
const entryData = {
  fields: {
    'title': { 'en-US': programData.title || '未命名節目' },
    'airDate': { 'en-US': programData.airDate || new Date().toISOString().split('T')[0] },
    'block': { 'en-US': getTimeBlock(programData.airTime) },
    'slotIndex': { 'en-US': programData.slotNumber || 0 },
    'isPremiere': { 'en-US': programData.isFirstBroadcast || false },
    'notes': { 'en-US': programData.description || '' },
    'video': { 'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'default-video-id' } } }
  }
};
```

## 📋 待處理事項

### 1. 測試修正結果
- [ ] 重新整理頁面 (F5)
- [ ] 嘗試上架節目
- [ ] 檢查是否成功上架
- [ ] 查看控制台錯誤訊息

### 2. 可能的後續問題
- [ ] `video` 欄位可能需要真實的影片 ID
- [ ] 檢查 Contentful 中的實際影片資料
- [ ] 驗證所有欄位是否正確映射

### 3. Firebase 登入測試
- [ ] 測試 Firebase 登入功能
- [ ] 使用帳號: `sammyzomb@gmail.com`
- [ ] 驗證登入成功後的跳轉

## 🚨 重要提醒

### 測試步驟
1. 打開 `admin-calendar-unified.html`
2. 按 F12 打開開發者工具
3. 查看 Console 標籤
4. 點擊「🔄 同步到 Contentful」或「📺 上架選中節目」
5. 觀察結果和錯誤訊息

### 如果仍有錯誤
- 檢查控制台中的具體錯誤訊息
- 確認 Contentful 中的欄位設定
- 驗證 API 權限和 Token

## 📁 相關檔案
- `admin-calendar-unified.html` - 主要修改檔案
- `contentful-real-only.js` - Contentful 連線系統
- `contentful-main-console.html` - Contentful 主控台

## 🔄 Git 提交記錄
- **Commit ID**: `d5124ef`
- **提交訊息**: "🔧 修正 Contentful 同步功能 - 解決欄位映射和驗證問題"
- **狀態**: 已推送到 GitHub

## 📞 下次繼續時
1. 檢查此檔案了解進度
2. 測試修正後的功能
3. 根據測試結果進行後續調整
4. 更新此進度記錄

---
**最後更新**: 2025年1月3日  
**狀態**: 等待測試修正結果  
**下一步**: 測試 Contentful 同步功能


