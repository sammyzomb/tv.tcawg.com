# GitHub 帳號管理系統使用說明

## 🎯 **系統概述**

這是一個使用 **GitHub 作為資料庫** 的管理員帳號管理系統，解決了原本 `localStorage` 無法跨設備同步的問題。

## ✨ **主要特色**

- **跨設備同步** - 所有設備都能使用相同帳號
- **即時更新** - 帳號變更立即生效
- **無需手動編輯程式碼** - 透過網頁介面管理
- **版本控制** - 所有變更都有 Git 記錄
- **備份機制** - 網路失敗時使用本地備份

## 🚀 **快速開始**

### 1. **設定 GitHub 資料來源**

編輯 `admin-accounts-service.js` 檔案，修改 `accountsUrl`：

```javascript
this.accountsUrl = 'https://raw.githubusercontent.com/您的用戶名/您的倉庫名/main/admin-accounts.json';
```

### 2. **上傳帳號資料檔案**

將 `admin-accounts.json` 上傳到您的 GitHub 倉庫的 `main` 分支。

### 3. **測試登入**

使用任何設備訪問登入頁面，系統會自動從 GitHub 獲取最新帳號資料。

## 📁 **檔案結構**

```
├── admin-accounts.json          # 帳號資料檔案（上傳到 GitHub）
├── admin-accounts-service.js    # 帳號管理服務
├── admin-login.html            # 登入頁面（已修改）
├── admin-accounts-management.html # 帳號管理介面
└── GITHUB_ACCOUNTS_SYSTEM.md   # 本說明文件
```

## 🔧 **帳號資料格式**

### 基本結構

```json
{
  "last_updated": "2025-01-15T10:00:00Z",
  "version": "1.0",
  "accounts": [
    {
      "id": "super_admin_001",
      "email": "sammyzomb@gmail.com",
      "name": "超級管理員",
      "role": "super_admin",
      "permissions": ["read", "write", "delete", "publish", "admin", "system"],
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z",
      "last_login": null,
      "password_hash": "Ddpeacemisb@"
    }
  ],
  "settings": {
    "max_login_attempts": 5,
    "lockout_duration_minutes": 15,
    "session_timeout_hours": 8,
    "password_policy": {
      "min_length": 8,
      "require_uppercase": true,
      "require_lowercase": true,
      "require_numbers": true,
      "require_special_chars": true
    }
  }
}
```

### 帳號欄位說明

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一識別碼 |
| `email` | string | ✅ | 登入用的 Email |
| `name` | string | ✅ | 顯示名稱 |
| `role` | string | ✅ | 角色：`admin` 或 `super_admin` |
| `permissions` | array | ✅ | 權限列表 |
| `status` | string | ✅ | 狀態：`active` 或 `inactive` |
| `created_at` | string | ✅ | 建立時間（ISO 格式） |
| `last_login` | string | ❌ | 最後登入時間 |
| `password_hash` | string | ✅ | 密碼（建議加密） |

## 📱 **使用方法**

### 新增帳號

1. 編輯 `admin-accounts.json`
2. 在 `accounts` 陣列中添加新帳號
3. 提交到 GitHub
4. 所有設備自動同步

### 修改帳號

1. 編輯 `admin-accounts.json`
2. 修改對應帳號的資料
3. 提交到 GitHub
4. 變更立即生效

### 刪除帳號

1. 編輯 `admin-accounts.json`
2. 從 `accounts` 陣列中移除帳號
3. 提交到 GitHub
4. 帳號立即無法登入

## 🔒 **安全注意事項**

### 密碼安全

- **不要**在 JSON 中存儲明文密碼
- 建議使用加密後的密碼雜湊
- 定期更換密碼

### 權限管理

- 謹慎分配 `super_admin` 角色
- 根據需要分配權限
- 定期檢查權限設定

### 版本控制

- 所有變更都會記錄在 Git 歷史中
- 可以回滾到任何之前的版本
- 建議在重要變更前建立分支

## 🚨 **故障排除**

### 無法從 GitHub 獲取資料

1. 檢查網路連線
2. 確認 GitHub 倉庫設定正確
3. 檢查 `accountsUrl` 是否正確
4. 系統會自動使用本地備份

### 登入失敗

1. 檢查帳號是否為 `active` 狀態
2. 確認密碼正確
3. 檢查權限設定
4. 查看瀏覽器控制台錯誤訊息

### 資料不同步

1. 點擊「刷新」按鈕強制更新
2. 檢查 GitHub 是否有最新變更
3. 清除瀏覽器快取
4. 等待 5 分鐘自動同步

## 🔄 **自動同步機制**

### 快取策略

- **快取時間**：5 分鐘
- **自動更新**：每次登入時檢查
- **手動刷新**：可強制立即更新

### 備份機制

- **本地備份**：每次成功獲取資料時更新
- **預設資料**：網路失敗時使用硬編碼資料
- **錯誤處理**：優雅降級，不影響系統運作

## 📈 **效能優化**

### 網路優化

- 使用 CDN 加速 GitHub 存取
- 實作請求節流
- 支援離線模式

### 快取優化

- 智能快取策略
- 增量更新支援
- 記憶體使用優化

## 🚀 **未來改進**

### 短期目標

- [ ] 實作密碼加密
- [ ] 添加登入日誌
- [ ] 支援多因素認證
- [ ] 實作帳號鎖定機制

### 長期目標

- [ ] 整合 OAuth 登入
- [ ] 支援 LDAP 整合
- [ ] 實作角色權限管理
- [ ] 添加審計日誌

## 📞 **技術支援**

### 常見問題

**Q: 為什麼不使用資料庫？**
A: GitHub 提供免費、可靠、版本控制的資料存儲，適合小型團隊使用。

**Q: 如何處理大量帳號？**
A: 系統支援數百個帳號，超過建議使用專業資料庫解決方案。

**Q: 密碼安全嗎？**
A: 目前使用明文存儲，建議實作加密機制。

### 聯絡方式

如有技術問題，請：
1. 檢查瀏覽器控制台錯誤訊息
2. 查看 GitHub 倉庫狀態
3. 確認網路連線正常

---

**版本**: 1.0  
**最後更新**: 2025-01-15  
**維護者**: 系統管理員
