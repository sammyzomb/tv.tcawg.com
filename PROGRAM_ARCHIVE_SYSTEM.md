# 📺 節目歸檔與分類系統設計

## 🎯 **系統目標**
建立完整的節目歸檔系統，讓播完的影片自動歸檔並按多維度分類，方便觀眾在「所有節目」頁面中瀏覽和搜尋。

## 📋 **系統架構**

### **1. 內容類型設計**

#### **節目歸檔 (Program Archive)**
**用途：** 管理已播出的節目，支援多維度分類和搜尋

**欄位設置：**
- **Original Program** (Reference) - 原始節目參考
- **Air Date** (Date) - 實際播出日期
- **Week Number** (Short text) - 播出週別（如：2024-W01）
- **Country/Region** (Short text) - 國家/地區
- **Category** (Short text) - 主要分類
- **Sub Category** (Short text) - 子分類
- **Tags** (Array) - 標籤陣列
- **Rating** (Number) - 觀眾評分（1-5）
- **View Count** (Number) - 觀看次數
- **Favorite Count** (Number) - 收藏次數
- **Status** (Short text) - 狀態（已歸檔/熱門/推薦）
- **Notes** (Long text) - 備註

### **2. 自動歸檔流程**

#### **觸發條件**
- 節目播出時間結束
- 管理員手動標記為已播出
- 系統定時檢查（每日凌晨）

#### **歸檔步驟**
1. **檢查播出狀態**
   - 確認節目已播出
   - 檢查是否已歸檔

2. **提取節目資訊**
   - 從原始節目獲取基本資訊
   - 解析標題中的國家/地區資訊
   - 確定分類和子分類

3. **創建歸檔記錄**
   - 自動創建 Program Archive 項目
   - 設定播出週別
   - 初始化統計數據

4. **分類標籤**
   - 根據內容自動分類
   - 添加相關標籤
   - 設定狀態

### **3. 分類系統設計**

#### **國家/地區分類**
```
亞洲
├── 日本
├── 韓國
├── 泰國
├── 越南
├── 新加坡
└── 其他亞洲國家

歐洲
├── 法國
├── 義大利
├── 德國
├── 英國
├── 西班牙
└── 其他歐洲國家

美洲
├── 美國
├── 加拿大
├── 墨西哥
├── 巴西
└── 其他美洲國家

其他
├── 澳洲
├── 紐西蘭
├── 非洲
└── 其他
```

#### **節目分類**
```
主要分類
├── 亞洲旅遊
├── 歐洲旅遊
├── 美洲旅遊
├── 美食旅遊
├── 極地旅遊
├── 自然旅遊
├── 文化旅遊
├── 冒險旅遊
└── 其他

子分類
├── 美食
├── 文化
├── 自然
├── 歷史
├── 藝術
├── 攝影
├── 海洋
├── 溫泉
├── 節慶
└── 其他
```

### **4. 前端展示系統**

#### **所有節目頁面 (videos.html)**
- **篩選功能**：
  - 按國家/地區篩選
  - 按分類篩選
  - 按週別篩選
  - 按評分篩選
  - 按觀看次數篩選

- **排序功能**：
  - 按播出日期排序
  - 按評分排序
  - 按觀看次數排序
  - 按收藏次數排序

- **搜尋功能**：
  - 關鍵字搜尋
  - 標籤搜尋
  - 組合搜尋

#### **節目詳情頁面**
- 顯示完整節目資訊
- 相關節目推薦
- 觀眾評論區
- 收藏和分享功能

### **5. 管理介面擴展**

#### **歸檔管理頁面**
- 查看所有已歸檔節目
- 手動調整分類
- 編輯標籤
- 設定推薦狀態

#### **統計分析頁面**
- 節目熱度分析
- 分類統計
- 國家/地區統計
- 觀眾行為分析

## 🔧 **技術實現**

### **1. Contentful 設置**
```javascript
// 自動歸檔觸發器
function autoArchivePrograms() {
  // 檢查已播出的節目
  const airedPrograms = getAiredPrograms();
  
  airedPrograms.forEach(program => {
    if (!isArchived(program)) {
      createArchiveEntry(program);
    }
  });
}

// 創建歸檔記錄
function createArchiveEntry(program) {
  const archiveData = {
    originalProgram: program.id,
    airDate: program.airDate,
    weekNumber: getWeekNumber(program.airDate),
    country: extractCountry(program.title),
    category: program.category,
    subCategory: determineSubCategory(program),
    tags: generateTags(program),
    rating: 0,
    viewCount: 0,
    favoriteCount: 0,
    status: 'archived',
    notes: ''
  };
  
  return contentful.createEntry('programArchive', archiveData);
}
```

### **2. 分類邏輯**
```javascript
// 從標題提取國家資訊
function extractCountry(title) {
  const countryPatterns = {
    '日本': ['日本', '東京', '大阪', '京都', '北海道'],
    '韓國': ['韓國', '首爾', '釜山', '濟州島'],
    '法國': ['法國', '巴黎', '里昂', '馬賽'],
    // ... 更多國家模式
  };
  
  for (const [country, patterns] of Object.entries(countryPatterns)) {
    if (patterns.some(pattern => title.includes(pattern))) {
      return country;
    }
  }
  
  return '其他';
}

// 確定子分類
function determineSubCategory(program) {
  const title = program.title.toLowerCase();
  const description = program.description.toLowerCase();
  
  if (title.includes('美食') || description.includes('美食')) return '美食';
  if (title.includes('文化') || description.includes('文化')) return '文化';
  if (title.includes('自然') || description.includes('自然')) return '自然';
  // ... 更多子分類邏輯
  
  return '其他';
}
```

### **3. 前端篩選系統**
```javascript
// 篩選功能
function filterPrograms(filters) {
  const { country, category, week, rating, viewCount } = filters;
  
  return archivedPrograms.filter(program => {
    if (country && program.country !== country) return false;
    if (category && program.category !== category) return false;
    if (week && program.weekNumber !== week) return false;
    if (rating && program.rating < rating) return false;
    if (viewCount && program.viewCount < viewCount) return false;
    
    return true;
  });
}
```

## 📊 **使用流程**

### **1. 節目播出後**
- 系統自動檢測播出完成
- 創建歸檔記錄
- 自動分類和標籤

### **2. 觀眾瀏覽**
- 進入「所有節目」頁面
- 使用篩選器找到感興趣的節目
- 按評分或熱度排序
- 收藏喜歡的節目

### **3. 管理員管理**
- 查看歸檔統計
- 調整分類和標籤
- 設定推薦節目
- 分析觀眾行為

## ✅ **實施步驟**

1. **創建 Program Archive 內容類型**
2. **設置自動歸檔邏輯**
3. **擴展前端篩選功能**
4. **優化節目展示頁面**
5. **添加統計分析功能**

---

**這個系統將讓您的節目管理更加完整和專業！** 🚀
