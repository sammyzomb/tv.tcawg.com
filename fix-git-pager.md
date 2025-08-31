# 🔧 Git 分頁器問題修復指南

## 問題描述
Git 命令（如 `git log`）會啟動分頁器，導致終端機卡住，無法繼續執行命令。

## 立即修復方法

### 方法一：永久禁用分頁器
在終端機中執行：
```bash
git config --global core.pager cat
```

### 方法二：使用 --no-pager 參數
```bash
git --no-pager log --oneline -5
git --no-pager status
git --no-pager remote -v
```

### 方法三：設定環境變數
```bash
export GIT_PAGER=cat
```

## 檢查同步狀態

### 1. 檢查遠端儲存庫
```bash
git --no-pager remote -v
```

### 2. 檢查分支狀態
```bash
git --no-pager branch -vv
```

### 3. 檢查提交歷史
```bash
git --no-pager log --oneline -3
```

### 4. 檢查同步狀態
```bash
git --no-pager status
```

## 同步操作

### 拉取最新變更
```bash
git pull origin main
```

### 推送本地變更
```bash
git add .
git commit -m "更新描述"
git push origin main
```

## 預防措施

### 1. 設定 Git 配置
```bash
# 禁用分頁器
git config --global core.pager cat

# 設定預設編輯器
git config --global core.editor notepad

# 設定認證快取
git config --global credential.helper store
```

### 2. 使用安全的同步流程
```bash
# 開始工作前
git --no-pager pull origin main

# 結束工作時
git add .
git commit -m "更新描述"
git push origin main
```

## 緊急修復

如果終端機完全卡住：
1. 關閉終端機視窗
2. 重新開啟新的終端機
3. 執行修復命令
4. 繼續同步操作

---

**立即執行修復命令！** 🚀
