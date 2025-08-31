# 環境變數設定指南

## 概述
為了保護敏感資訊，我們已將所有硬編碼的 API Token 和密碼移除，改為使用環境變數。

## 設定步驟

### 1. 複製範例檔案
```bash
cp env.example .env
```

### 2. 編輯 .env 檔案
將 `env.example` 中的範例值替換為實際的資訊：

```env
# Contentful 設定
CONTENTFUL_SPACE_ID=os5wf90ljenp
CONTENTFUL_DELIVERY_TOKEN=lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0
CONTENTFUL_PREVIEW_TOKEN=your-preview-token-here
CONTENTFUL_MANAGEMENT_TOKEN=CFPAT-hNLOfw3XdP5Hf_C3eYjI294agakAK0Yo5Ew1Mjnsqs

# 超級管理員設定
SUPER_ADMIN_EMAIL=sammyzomb@gmail.com
SUPER_ADMIN_PASSWORD=Ddpeacemisb@

# 其他設定
NODE_ENV=development
```

### 3. 驗證設定
- `.env` 檔案已加入 `.gitignore`，不會被提交到 Git
- 網站會自動讀取環境變數
- Contentful 連線應該恢復正常

## 重要提醒
- **不要**將 `.env` 檔案提交到 Git
- **不要**在程式碼中硬編碼這些值
- 在每台電腦上都需要設定 `.env` 檔案
- 如果使用伺服器部署，需要在伺服器上設定環境變數

## 故障排除
如果網站無法連接到 Contentful：
1. 確認 `.env` 檔案存在且格式正確
2. 確認 API Token 和 Space ID 正確
3. 檢查瀏覽器控制台是否有錯誤訊息

