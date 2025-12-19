# 🚀 本地伺服器啟動指南

## 為什麼需要本地伺服器？

從檔案總管直接打開 `index.html`（使用 `file://` 協議）會導致：
- ❌ YouTube 播放器無法正常載入
- ❌ Contentful API 可能無法運作
- ❌ 某些瀏覽器安全功能無法正常使用

使用本地伺服器（`http://localhost`）可以解決這些問題。

## 📋 啟動方法

### 方法 1：使用 Python（推薦）

1. **確認已安裝 Python**
   - 打開命令提示字元（CMD）或 PowerShell
   - 輸入 `python --version` 檢查是否已安裝
   - 如果沒有，請從 [python.org](https://www.python.org/downloads/) 下載安裝

2. **啟動伺服器**
   - **Windows 使用者**：雙擊 `start-server.bat`
   - **或手動執行**：
     ```bash
     python -m http.server 8000
     ```

3. **打開瀏覽器**
   - 訪問：`http://localhost:8000`
   - 或：`http://localhost:8000/index.html`

### 方法 2：使用 Node.js（如果已安裝）

```bash
npx http-server -p 8000
```

### 方法 3：使用 VS Code Live Server

如果您使用 VS Code：
1. 安裝 "Live Server" 擴充功能
2. 右鍵點擊 `index.html`
3. 選擇 "Open with Live Server"

## ⚠️ 注意事項

- 啟動伺服器後，請保持命令視窗開啟
- 要停止伺服器，按 `Ctrl+C`
- 如果 8000 端口被占用，可以改用其他端口（如 8080）

## 🔧 故障排除

**問題：Python 未安裝**
- 解決：從 [python.org](https://www.python.org/downloads/) 下載安裝

**問題：端口被占用**
- 解決：修改 `start-server.bat` 中的 `8000` 為其他數字（如 `8080`）

**問題：無法訪問 localhost**
- 解決：檢查防火牆設定，確保允許本地連接






