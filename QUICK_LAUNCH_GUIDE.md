# 🚀 快速上線指南 - 星期五前完成

## 📋 系統概覽

您的旅遊電視頻道已經有完整的管理後台，包含：
- ✅ 節目表管理 (`admin-schedule.html`)
- ✅ 月曆排程管理 (`admin-calendar.html`) 
- ✅ 節目檔案管理 (`admin-archive.html`)
- ✅ 管理員登入 (`admin-login.html`)

## 🎯 快速上線步驟

### 1. 測試系統 (5分鐘)
1. 打開瀏覽器，前往：`http://localhost:8000`
2. 測試首頁是否正常顯示
3. 前往：`http://localhost:8000/admin-login.html`
4. 使用測試帳號登入：
   - 帳號：`admin@travelchannel.com`
   - 密碼：`password123`

### 2. 設定 Contentful CMS (10分鐘)
1. 前往 [Contentful](https://www.contentful.com/)
2. 登入您的帳戶
3. 按照 `CONTENTFUL_SETUP.md` 的步驟設定內容模型
4. 複製您的 Space ID 和 Access Token

### 3. 更新 API 設定 (2分鐘)
1. 打開 `contentful-api.js`
2. 將第 3-4 行的 Space ID 和 Token 替換為您的：
```javascript
this.spaceId = '您的_SPACE_ID';
this.deliveryToken = '您的_ACCESS_TOKEN';
```

### 4. 上架人員培訓 (15分鐘)

#### 基本操作流程：
1. **登入管理後台**
   - 網址：`http://localhost:8000/admin-login.html`
   - 使用分配的帳號密碼

2. **添加節目**
   - 前往：`http://localhost:8000/admin-schedule.html`
   - 填寫節目資訊（標題、時間、分類等）
   - 點擊「添加節目」

3. **月曆排程**
   - 前往：`http://localhost:8000/admin-calendar.html`
   - 點擊日期格子添加節目
   - 使用範本快速建立節目

4. **節目檔案管理**
   - 前往：`http://localhost:8000/admin-archive.html`
   - 管理已上架的節目
   - 搜尋和編輯節目

## 📝 上架人員操作手冊

### 節目添加範例：
```
節目標題：早安世界 - 日本東京晨間漫步
播出時間：06:00
節目時長：60分鐘
節目分類：亞洲旅遊
節目描述：跟著我們一起探索東京的早晨，從築地市場到淺草寺的寧靜時光
```

### 常用節目分類：
- 亞洲旅遊
- 歐洲旅遊  
- 美洲旅遊
- 美食旅遊
- 極地旅遊
- 自然旅遊
- 文化旅遊
- 海島旅遊

## 🔧 故障排除

### 如果系統無法啟動：
1. 確認 Python 已安裝
2. 在專案資料夾執行：`python -m http.server 8000`
3. 檢查防火牆設定

### 如果無法登入：
1. 檢查帳號密碼是否正確
2. 確認 `contentful-api.js` 中的 API 設定
3. 檢查瀏覽器控制台是否有錯誤訊息

### 如果節目無法顯示：
1. 確認 Contentful 設定正確
2. 檢查節目資料格式
3. 重新整理頁面

## 📞 緊急聯絡

如果遇到技術問題：
1. 檢查 `README.md` 文件
2. 查看瀏覽器控制台錯誤訊息
3. 確認所有檔案都在正確位置

## 🎉 上線檢查清單

- [ ] 系統可以正常啟動
- [ ] 管理後台可以登入
- [ ] 可以添加新節目
- [ ] 節目表正常顯示
- [ ] 首頁節目表更新
- [ ] 上架人員已培訓完成

## 🚀 部署到正式環境

完成測試後，將檔案上傳到您的 Web 伺服器：
1. 上傳所有 HTML、CSS、JS 檔案
2. 更新 Contentful API 設定
3. 測試所有功能
4. 通知上架人員開始工作

---

**重要提醒**：這個系統已經可以立即使用！上架人員只需要學會基本的操作流程，就可以開始添加節目內容了。
