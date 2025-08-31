# 🔧 環境變數設定指南

## 📋 設定說明

此檔案提供環境變數的設定範例，請根據您的實際情況填入相應的值。

## 🔧 建立 .env 檔案

請在專案根目錄建立 `.env` 檔案，並填入以下內容：

```bash
# 環境變數檔案
# 請妥善保管此檔案，不要提交到版本控制系統

# Contentful 設定
CONTENTFUL_SPACE_ID=your_space_id_here
CONTENTFUL_DELIVERY_TOKEN=your_delivery_token_here
CONTENTFUL_PREVIEW_TOKEN=your_preview_token_here
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token_here

# 超級管理員設定
SUPER_ADMIN_EMAIL=your_admin_email_here
SUPER_ADMIN_PASSWORD=your_admin_password_here

# 網站設定
SITE_URL=https://your-domain.com
SITE_NAME=您的網站名稱
ENVIRONMENT=production

# 安全設定
SESSION_SECRET=your_session_secret_here
ENCRYPTION_KEY=your_encryption_key_here
```

## 📋 Token 說明

### Contentful API Tokens：

1. **Space ID**: 您的 Contentful 空間識別碼
2. **Content Delivery API Token**: 用於讀取已發布的內容
3. **Content Preview API Token**: 用於讀取草稿和預覽內容
4. **Content Management API Token**: 用於創建、編輯、刪除內容

## 🔒 安全注意事項

- ✅ 將 `.env` 檔案加入 `.gitignore`
- ✅ 不要將 `.env` 檔案提交到 Git
- ✅ 不要將 Token 分享給他人
- 🔄 定期更換 Token
- 🔄 監控 Token 使用情況

## 🚀 設定步驟

1. **建立 .env 檔案**
2. **填入實際的 Token 和設定**
3. **測試功能**
4. **確認安全設定**

---

**請根據實際情況填入相應的值！** 🔧
