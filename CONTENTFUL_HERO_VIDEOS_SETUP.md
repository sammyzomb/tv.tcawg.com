# 🎬 Contentful HERO 影片設定指南

## 🚨 **重要說明**
**系統完全依賴 Contentful 作為唯一資料來源，不提供任何備用資料。**

目前系統顯示「無 HERO 影片資料」，這是因為 Contentful 中沒有設定 HERO 影片。本指南將協助您在 Contentful 中正確設定 HERO 影片。

## 🎯 **解決方案**

### **步驟 1：檢查現有內容類型**
1. 登入 [Contentful](https://app.contentful.com)
2. 選擇 Space：`os5wf90ljenp`
3. 點擊左側選單 **"Content model"**
4. 檢查是否有 `video` 內容類型

### **步驟 2：創建 Video 內容類型（如果不存在）**

#### **2.1 創建內容類型**
1. 點擊 **"Add content type"**
2. 輸入名稱：`Video`
3. 點擊 **"Create"**

#### **2.2 添加必要欄位**
依序添加以下欄位：

| 欄位名稱 | 類型 | 必填 | 說明 |
|---------|------|------|------|
| Title | Short text | ✅ | 影片標題 |
| YouTube ID | Short text | ✅ | YouTube 影片 ID |
| Description | Long text | ❌ | 影片描述 |
| isHero | Boolean | ✅ | 是否為 HERO 影片 |
| Hero Title | Short text | ❌ | HERO 顯示標題 |
| Hero Text | Long text | ❌ | HERO 說明文字 |
| Thumbnail | Media | ❌ | 影片縮圖 |

### **步驟 3：添加 HERO 影片內容**

#### **3.1 進入內容區域**
1. 點擊左側選單 **"Content"**
2. 選擇 **"Video"** 內容類型
3. 點擊 **"Add entry"**

#### **3.2 添加 HERO 影片**
使用以下範例資料創建 HERO 影片：

**影片 1：雅加達 千島群島 浮潛**
```
Title: 雅加達 千島群島 浮潛
YouTube ID: 3GZCJfIOg_k
Description: 潛入海洋，探索繽紛的熱帶生態
isHero: true
Hero Title: 雅加達 千島群島 浮潛
Hero Text: 潛入海洋，探索繽紛的熱帶生態
```

**影片 2：雅加達 火山**
```
Title: 雅加達 火山
YouTube ID: LcdGhVwS3gw
Description: 走訪壯觀的活火山與地熱奇景
isHero: true
Hero Title: 雅加達 火山
Hero Text: 走訪壯觀的活火山與地熱奇景
```

**影片 3：雅加達**
```
Title: 雅加達
YouTube ID: gw5A5Db3yMM
Description: 探索世界美景，體驗旅遊的無限可能
isHero: true
Hero Title: 雅加達
Hero Text: 探索世界美景，體驗旅遊的無限可能
```

**影片 4：俄羅斯 莫斯科 紅場**
```
Title: 俄羅斯 莫斯科 紅場
YouTube ID: 25Fmx1G-C3k
Description: 走進俄羅斯歷史心臟，宏偉紅場
isHero: true
Hero Title: 俄羅斯 莫斯科 紅場
Hero Text: 走進俄羅斯歷史心臟，宏偉紅場
```

**影片 5：極光**
```
Title: 極光
YouTube ID: u4XvG8jkToY
Description: 追尋極地夜空中最美的奇幻光芒
isHero: true
Hero Title: 極光
Hero Text: 追尋極地夜空中最美的奇幻光芒
```

**影片 6：挪威峽灣郵輪**
```
Title: 挪威峽灣郵輪
YouTube ID: jLNBKAFgtNU
Description: 郵輪穿越冰河峽灣，壯闊如畫
isHero: true
Hero Title: 挪威峽灣郵輪
Hero Text: 郵輪穿越冰河峽灣，壯闊如畫
```

**影片 7：祕魯 馬丘比丘**
```
Title: 祕魯 馬丘比丘
YouTube ID: QoHTSSS3DwQ
Description: 攀上神秘古城，領略印加文明
isHero: true
Hero Title: 祕魯 馬丘比丘
Hero Text: 攀上神秘古城，領略印加文明
```

**影片 8：阿根廷 伊瓜蘇瀑布**
```
Title: 阿根廷 伊瓜蘇瀑布
YouTube ID: BDnpjQmGRqY
Description: 感受壯闊奔騰的南美大瀑布
isHero: true
Hero Title: 阿根廷 伊瓜蘇瀑布
Hero Text: 感受壯闊奔騰的南美大瀑布
```

**影片 9：非洲 獵豹**
```
Title: 非洲 獵豹
YouTube ID: 8YFLi5hZ2lc
Description: 非洲原野，見證速度與野性
isHero: true
Hero Title: 非洲 獵豹
Hero Text: 非洲原野，見證速度與野性
```

### **步驟 4：發布內容**
1. 填寫完所有欄位後，點擊 **"Publish"**
2. 確認發布成功
3. 重複此步驟創建所有 9 個 HERO 影片

### **步驟 5：驗證設定**
1. 返回 HERO 影片管理系統
2. 點擊 **"重新載入資料"**
3. 確認顯示「✅ 從 Contentful 載入 X 個 HERO 影片」

## 🔧 **重要設定說明**

### **⚠️ 唯一資料來源**
- **系統完全依賴 Contentful 資料**
- **不提供任何備用資料或本地資料**
- **如果 Contentful 沒有資料，系統將無法運作**

### **isHero 欄位**
- **必須設定為 `true`** 才會被系統識別為 HERO 影片
- 只有 `isHero: true` 的影片才會在首頁播放

### **YouTube ID 格式**
- 只需要 YouTube 影片 ID，不需要完整網址
- 例如：`3GZCJfIOg_k` 而不是 `https://www.youtube.com/watch?v=3GZCJfIOg_k`

### **欄位對應**
系統會依序尋找以下欄位：
- **YouTube ID**: `YouTube ID` 或 `youTubeId` 或 `youtubeId`
- **標題**: `HERO主題` 或 `heroTitle` 或 `title`
- **描述**: `HERO右下說明文字` 或 `heroText` 或 `description`
- **HERO 設定**: `首頁HERO` (Boolean)

## ✅ **完成檢查清單**

- [ ] 創建 Video 內容類型
- [ ] 添加所有必要欄位
- [ ] 創建 9 個 HERO 影片內容
- [ ] 設定 `isHero: true` 為所有 HERO 影片
- [ ] 發布所有內容
- [ ] 驗證系統載入成功

## 🚨 **常見問題**

### **Q: 為什麼還是顯示「無 HERO 影片資料」？**
A: 請檢查：
1. 是否已發布內容（不是草稿狀態）
2. `isHero` 欄位是否設定為 `true`
3. YouTube ID 是否正確
4. Contentful 連線是否正常

### **Q: 如何檢查 Contentful 連線？**
A: 使用 HERO 影片管理系統的「檢查工具」分頁，或查看瀏覽器開發者工具的 Console 訊息。

### **Q: 可以添加更多 HERO 影片嗎？**
A: 可以，只要設定 `isHero: true` 即可。系統會自動載入所有 HERO 影片。

## 📞 **需要協助？**

如果設定過程中遇到問題：
1. 檢查 Contentful 文檔：https://www.contentful.com/developers/docs/
2. 查看 HERO 影片管理系統的操作日誌
3. 確認所有必填欄位都已填寫

---

**完成時間：** 約 15-20 分鐘  
**下一步：** 測試 HERO 影片播放功能
