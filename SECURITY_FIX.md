# 🛡️ 安全性修復指南

## 🚨 發現的安全問題

### 高風險問題
1. **Contentful API Token 外露**
   - Token: `your-delivery-token-here`
   - 影響: 8個檔案中硬編碼
   - 風險: 任何人都可以訪問您的 Contentful 內容

2. **測試密碼外露**
   - 密碼: `password123`
   - 影響: 6個檔案中明文顯示
   - 風險: 管理後台登入密碼被公開

3. **Space ID 外露**
   - ID: `os5wf90ljenp`
   - 影響: 多個檔案中公開
   - 風險: 雖然不是高風險，但建議保護

## 🔧 修復步驟

### 第一步：立即移除敏感資訊

#### 1. 移除 API Token
```javascript
// 在以下檔案中移除硬編碼的 token：
// - admin-login.html
// - admin-calendar.html
// - all-videos.js
// - contentful-api.js
// - featured.js
// - media.js
// - setup_contentful.js
// - script.js
// - videos.html

// 替換為：
const CONTENTFUL_TOKEN = process.env.CONTENTFUL_TOKEN || 'YOUR_TOKEN_HERE';
```

#### 2. 移除測試密碼
```javascript
// 在以下檔案中移除硬編碼的密碼：
// - admin-login.html
// - contentful-api.js
// - 各種 .md 檔案

// 替換為：
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'CHANGE_THIS_PASSWORD';
```

#### 3. 保護 Space ID
```javascript
// 替換為：
const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID || 'YOUR_SPACE_ID';
```

### 第二步：使用環境變數

#### 1. 建立 .env 檔案
```bash
# .env 檔案（不要提交到 Git）
CONTENTFUL_SPACE_ID=os5wf90ljenp
CONTENTFUL_TOKEN=YOUR_NEW_TOKEN_HERE
ADMIN_PASSWORD=YOUR_NEW_PASSWORD_HERE
```

#### 2. 更新 .gitignore
```bash
# .gitignore
.env
*.env
secrets/
```

### 第三步：更新 Contentful Token

#### 1. 在 Contentful 中重新生成 Token
1. 登入 Contentful
2. 前往 Settings > API keys
3. 刪除舊的 Token
4. 生成新的 Token
5. 更新所有使用的地方

#### 2. 更新管理員密碼
1. 更改測試密碼為強密碼
2. 使用環境變數管理
3. 移除所有硬編碼的密碼

## 🚀 立即行動清單

### 緊急修復（立即執行）
- [ ] 在 Contentful 中重新生成 API Token
- [ ] 更改管理員密碼
- [ ] 移除所有硬編碼的敏感資訊
- [ ] 建立 .env 檔案
- [ ] 更新 .gitignore

### 安全加固（24小時內）
- [ ] 實施環境變數管理
- [ ] 添加 API 請求限制
- [ ] 實施登入嘗試限制
- [ ] 添加 HTTPS 強制重定向

### 長期安全（一週內）
- [ ] 實施雙重認證
- [ ] 添加操作日誌
- [ ] 定期安全審計
- [ ] 備份安全策略

## 📞 需要協助？

如果您需要幫助實施這些修復：
1. 我可以幫您更新程式碼
2. 指導您重新生成 Token
3. 協助設置環境變數
4. 實施額外的安全措施

---

**立即行動！** 🚨 這些安全問題需要立即修復。
