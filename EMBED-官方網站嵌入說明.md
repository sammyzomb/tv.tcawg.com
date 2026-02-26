# 在官方旅遊網站中嵌入「航向世界旅遊頻道」

## 目標

- **保留**官方網站 (tcawg.com) 的最上方導航列（header）。
- **從「影片專區」開始**，改為嵌入本頻道網站內容（不再顯示官方站原本的影片列表區塊）。

## 作法概述

1. **頻道站**（本專案）已支援 **嵌入模式**：網址加上 `?embed=1` 時會隱藏自己的導航列，避免重複。
2. **官方站**在「影片專區」頁面中，把原本的影片專區區塊整段**替換成一個 iframe**，iframe 載入頻道站的 `index.html?embed=1`。

## 步驟一：部署頻道站並取得網址

1. 將本專案（teavel-video-site）部署到可對外存取的網址，例如：
   - `https://tv.tcawg.com/`
   - 或 `https://www.tcawg.com/travel/tv/` 等。
2. 確認首頁可正常開啟，且加上 `?embed=1` 時不會出現頻道自己的導航列（本專案已實作）。

## 步驟二：在官方站替換「影片專區」區塊

1. 在官方旅遊網站後台或原始碼中，找到**影片專區頁面**（例如 `video.html` 或對應的模板）。
2. 找到從 **`<div id="video" class="g-wrap grid">`** 開始的區塊，一直到這個區塊的**結束**（包含裡面的 breadcrumb、`影片專區` 標題、video-bar、所有 ti-wrap / video-list 等），整段刪除。
3. 改為貼上 `官方網站-影片專區-替換區塊.html` 裡的「替換區塊」內容。
4. 把 iframe 的 **`src`** 改成您實際的頻道網址，並**務必加上** `?embed=1`，例如：
   - `https://tv.tcawg.com/index.html?embed=1`
   - 若頻道放在子路徑：`https://www.tcawg.com/travel/tv/index.html?embed=1`

## 替換前後結構

- **替換前**：`<header>...</header>` → `<div id="video">`（麵包屑 + 標題 + 影片分類列 + 大量影片列表）→ `<div id="pnote">` → `<footer>...`
- **替換後**：`<header>...</header>`（不變）→ `<div id="video">`（麵包屑 + 標題 + **一個 iframe**）→ `<div id="pnote">` → `<footer>...`

這樣使用者只會看到官方的最上方導航列，下方直接是頻道站的內容（無頻道導航列）。

## iframe 高度

替換區塊中 iframe 使用 `height:80vh; min-height:600px`，可依需求在官方站 CSS 或 inline style 中調整，例如改為固定 `height:700px` 或 `min-height:800px`。

## 注意事項

- 若頻道與官方站**不同網域**，需確認頻道站是否允許被 iframe（X-Frame-Options / CSP）。
- 頻道站若與官方站同網域或同站子路徑，通常不會有跨域 iframe 問題。
