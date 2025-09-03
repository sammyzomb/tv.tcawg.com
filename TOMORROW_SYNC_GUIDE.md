# 明天到公司時同步 GitHub 的完整說明

## 🚀 快速開始

### 步驟 1：開啟終端機
- 按 `Win + R`，輸入 `cmd` 或 `powershell`
- 或者使用 VS Code 的終端機

### 步驟 2：切換到專案目錄
```bash
cd C:\Users\USER\Documents\TV.TCAWG.COM\travel-video-site
```

### 步驟 3：同步 GitHub
```bash
git pull origin main
```

## 📥 完整同步流程

### 1. 檢查 Git 狀態
```bash
git status
```

### 2. 拉取最新更新
```bash
git pull origin main
```

### 3. 確認同步成功
```bash
git log --oneline -5
```

## 📋 明天需要測試的內容

### 🔓 清除 IP 封鎖
在瀏覽器控制台執行：
```javascript
localStorage.removeItem('blockedIPs');
sessionStorage.removeItem('blockedIPs');
location.reload();
```

### 🧪 測試 Firebase 登入
1. 開啟 `admin-login.html`
2. 使用帳號：`sammyzomb@gmail.com`
3. 使用密碼：`Ddpeacemisb@`
4. 點擊登入按鈕

### ✅ 驗證登入成功
- 確認跳轉到 `admin-dashboard.html`
- 檢查 Firebase 認證狀態
- 測試 session 管理

## 📁 重要文件清單

### 主要文件
- `admin-login.html` - Firebase 登入頁面
- `admin-accounts-service.js` - 帳號管理服務
- `FIREBASE_SETUP_GUIDE.md` - Firebase 設定指南

### 進度文件
- `TODAY_PROGRESS_SUMMARY.md` - 今日進度總結
- `TOMORROW_SYNC_GUIDE.md` - 本說明文件

### 測試文件
- `firebase-test.html` - Firebase 測試頁面
- `test-login.html` - 登入測試頁面

## 🔧 技術配置

### Firebase 版本
- **Firebase App**: 9.23.0
- **Firebase Auth**: 9.23.0
- **Analytics**: 已禁用

### Firebase 配置
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB5MLyG5H1sCflHFU7WeKQCmC0Ft5TlqjM",
  authDomain: "tv-tcawg-com.firebaseapp.com",
  projectId: "tv-tcawg-com",
  storageBucket: "tv-tcawg-com.firebasestorage.app",
  messagingSenderId: "313251141126",
  appId: "1:313251141126:web:88ef97ce28798c0a2e9587",
  measurementId: "G-83Z5VTRTZH"
};
```

## 🚨 可能遇到的問題

### 1. Git 衝突
如果出現衝突：
```bash
git stash
git pull origin main
git stash pop
```

### 2. 權限問題
如果無法拉取：
```bash
git config --global user.name "您的GitHub用戶名"
git config --global user.email "您的GitHub郵箱"
```

### 3. 網路問題
如果網路不穩定：
```bash
git pull origin main --depth=1
```

## 📊 進度檢查清單

- [ ] 成功同步 GitHub
- [ ] 清除 IP 封鎖
- [ ] 測試 Firebase 登入
- [ ] 驗證登入成功
- [ ] 測試頁面跳轉
- [ ] 檢查 session 管理

## 🎯 成功標準

### Firebase 登入測試成功
- 輸入帳號密碼後點擊登入
- 沒有出現錯誤訊息
- 頁面自動跳轉到管理後台

### 系統功能正常
- 登入狀態正確保存
- 頁面跳轉正常
- 沒有 JavaScript 錯誤

## 📞 如果遇到問題

### 檢查瀏覽器控制台
- 按 `F12` 開啟開發者工具
- 查看 Console 標籤的錯誤訊息
- 檢查 Network 標籤的網路請求

### 檢查 Firebase Console
- 確認專案狀態正常
- 檢查 Authentication 設定
- 確認 API Key 有效

## 🚀 下一步計劃

完成 Firebase 登入測試後：
1. 整合到其他管理頁面
2. 添加登出功能
3. 完善用戶權限管理
4. 測試整個管理系統

---

**重要提醒**: 明天到公司後，先同步 GitHub，然後按照這個說明文件進行測試！
