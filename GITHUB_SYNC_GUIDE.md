# GitHub 同步指南

## 🚀 快速同步到工作電腦

### 第一步：建立 GitHub 儲存庫

1. **前往 GitHub.com**
   - 登入您的 GitHub 帳號
   - 點擊右上角 "+" → "New repository"

2. **設定儲存庫**
   - Repository name: `travel-video-site`
   - Description: `航向世界旅遊頻道網站`
   - 選擇 "Public" 或 "Private"
   - 不要勾選 "Add a README file"
   - 點擊 "Create repository"

### 第二步：上傳當前專案

在您目前的電腦上執行以下指令：

```bash
# 1. 初始化 Git 儲存庫
git init

# 2. 添加所有檔案
git add .

# 3. 提交變更
git commit -m "初始版本：旅遊頻道網站完成"

# 4. 添加遠端儲存庫（替換 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/travel-video-site.git

# 5. 推送到 GitHub
git branch -M main
git push -u origin main
```

### 第三步：在工作電腦下載

在工作電腦上執行：

```bash
# 1. 複製專案
git clone https://github.com/YOUR_USERNAME/travel-video-site.git

# 2. 進入專案資料夾
cd travel-video-site

# 3. 啟動本地伺服器
python -m http.server 8000
```

### 第四步：後續同步

#### 在目前電腦上更新：
```bash
git add .
git commit -m "更新描述"
git push
```

#### 在工作電腦上更新：
```bash
git pull
```

## 📁 重要檔案清單

確保以下檔案都已同步：

### 核心檔案
- `index.html` - 主頁面
- `script.js` - 主要 JavaScript
- `style.css` - 樣式表
- `schedule.json` - 節目表資料

### 管理後台
- `admin-login.html` - 登入頁面
- `admin-dashboard.html` - 管理儀表板
- `admin-schedule.html` - 節目表管理
- `admin-calendar.html` - 月曆節目管理

### 設定檔案
- `contentful-api.js` - Contentful API
- `CONTENTFUL_SETUP.md` - Contentful 設定指南
- `QUICK_LAUNCH_GUIDE.md` - 快速啟動指南

## 🔧 工作電腦設定

### 1. 安裝必要軟體
- Python 3.x
- 網頁瀏覽器（Chrome/Firefox）

### 2. 測試步驟
1. 開啟終端機/命令提示字元
2. 導航到專案資料夾
3. 執行：`python -m http.server 8000`
4. 開啟瀏覽器訪問：`http://localhost:8000`

### 3. 驗證功能
- ✅ 主頁面正常顯示
- ✅ 管理後台登入功能
- ✅ 節目表管理功能
- ✅ 月曆節目管理功能
- ✅ 歷史搜尋功能

## 🚨 注意事項

1. **不要上傳敏感資訊**
   - 檢查是否有 API 金鑰
   - 確認沒有個人密碼

2. **備份重要資料**
   - 本地儲存的節目資料
   - 使用者設定

3. **版本控制**
   - 每次重要更新都要 commit
   - 寫清楚的 commit 訊息

## 📞 遇到問題？

1. **Git 指令錯誤**
   - 檢查網路連線
   - 確認 GitHub 帳號權限

2. **檔案同步失敗**
   - 檢查檔案權限
   - 確認檔案路徑正確

3. **網站無法啟動**
   - 確認 Python 已安裝
   - 檢查埠號是否被占用

