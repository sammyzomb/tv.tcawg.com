# 🎯 精選節目設定指南

## 📋 **問題診斷**

如果首頁的精選節目區域顯示「目前無法載入精選節目」，請按照以下步驟檢查和設定：

## 🔧 **解決步驟**

### **步驟 1：使用診斷工具**

1. 開啟 `check-featured-videos.html` 檔案
2. 點擊「開始診斷」按鈕
3. 查看診斷結果

### **步驟 2：檢查 Contentful 設定**

#### **2.1 登入 Contentful**
1. 前往 [Contentful](https://app.contentful.com)
2. 選擇 Space：`os5wf90ljenp`
3. 登入您的帳戶

#### **2.2 檢查 Content Type**
1. 點擊左側選單「Content model」
2. 確認是否有 `video` content type
3. 如果沒有，需要創建

#### **2.3 創建 Video Content Type（如果不存在）**

1. 點擊「Add content type」
2. 輸入名稱：`Video`
3. 輸入 API Identifier：`video`
4. 點擊「Create」

**添加必要欄位：**

| 欄位名稱 | 欄位類型 | 必填 | API Identifier | 說明 |
|---------|---------|------|---------------|------|
| 影片標題 | Short text | ✅ | title | 影片名稱 |
| 影片描述 | Long text | ❌ | description | 影片說明 |
| **精選標記** | **Boolean** | **❌** | **isFeatured** | **是否為精選節目** |
| YouTube ID | Short text | ❌ | youTubeId | YouTube 影片 ID |
| 縮圖 | Media | ❌ | thumbnail | 影片縮圖 |
| 標籤 | Array | ❌ | tags | 影片標籤 |

### **步驟 3：創建精選節目內容**

#### **3.1 創建新內容**
1. 點擊左側選單「Content」
2. 點擊「Add entry」
3. 選擇「Video」content type

#### **3.2 填寫內容資訊**
- **影片標題**：輸入節目名稱
- **影片描述**：輸入節目描述
- **精選標記**：**必須設定為 `true`** ⭐
- **YouTube ID**：輸入 YouTube 影片 ID（例如：`3GZCJfIOg_k`）
- **縮圖**：上傳或使用 YouTube 自動縮圖
- **標籤**：添加相關標籤

#### **3.3 發布內容**
1. 點擊右上角「Publish」按鈕
2. **重要：必須發布，不能是草稿狀態**

### **步驟 4：驗證設定**

1. 返回診斷工具
2. 點擊「開始診斷」
3. 確認顯示「✅ 找到 X 個精選節目」

## 🎯 **重要注意事項**

### **⚠️ 關鍵設定**
- **`isFeatured` 必須設定為 `true`**
- **內容必須已發布（不是草稿）**
- **YouTube ID 格式正確**（11個字符，例如：`3GZCJfIOg_k`）

### **📝 欄位對應**
程式碼會依序尋找以下欄位：
- **標題**：`title` 或 `影片標題`
- **描述**：`description` 或 `精選推薦影片說明文字`
- **YouTube ID**：`youTubeId` 或 `youtubeId` 或 `YouTubeID`
- **精選標記**：`isFeatured`

### **🔄 備用機制**
如果 Contentful 沒有精選節目，系統會顯示 8 個預設的精選節目：
- 雅加達千島群島浮潛
- 雅加達火山
- 俄羅斯莫斯科紅場
- 極光
- 挪威峽灣郵輪
- 祕魯馬丘比丘
- 阿根廷伊瓜蘇瀑布
- 非洲獵豹

## 🚨 **常見問題**

### **Q: 為什麼還是顯示「目前無法載入精選節目」？**
A: 請檢查：
1. `isFeatured` 是否設定為 `true`
2. 內容是否已發布
3. Contentful 連線是否正常

### **Q: 如何檢查 Contentful 連線？**
A: 使用診斷工具的「測試連線」功能

### **Q: 可以添加更多精選節目嗎？**
A: 可以，只要設定 `isFeatured: true` 並發布即可

## 📞 **需要協助？**

如果設定過程中遇到問題：
1. 使用診斷工具檢查狀態
2. 查看瀏覽器開發者工具的 Console 訊息
3. 確認 Contentful 帳戶權限

---

**完成後，首頁的精選節目區域應該會正常顯示您設定的精選節目！** 🎉

