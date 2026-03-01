# 影片專區：無法改 tcawg.com 時的作法

因為不能修改 TCAWG 官網，要讓「點擊播放後不需捲動就看到視窗」，只能**在我們站內放一份影片專區頁面**並加上修正，再讓首頁 iframe 載入這份。

---

## 步驟一：取得 TCAWG 影片專區完整 HTML

1. 用瀏覽器開啟：https://www.tcawg.com/travel/video.html  
2. 在頁面空白處按右鍵 → **另存新檔**（或 檢視 → 開發人員選項 → 原始碼，全選複製）。  
3. 存成 **`video-tcawg-with-fix.html`**，放在本專案**根目錄**（與 `index.html` 同層）。  
   - 若另存時檔名被改成 `video.html`，請手動改為 `video-tcawg-with-fix.html`。

---

## 步驟二：在該檔的 `</body>` 前加入修正片段

1. 用編輯器開啟 **`video-tcawg-with-fix.html`**。  
2. 搜尋 **`</body>`**（通常接近檔案最底部）。  
3. 在 **`</body>` 正上方**貼上 **`tcawg-video-popup-fix-snippet.html`** 的**完整內容**（從 `<!-- 修正` 到 `</script>` 整段）。  
4. 存檔。

這樣一來，這份複本仍會用 TCAWG 的 CSS/JS/圖片（因為原頁有 `<base href="https://www.tcawg.com/travel/">`），只是多了一段我們自己的樣式與腳本，彈窗會置頂且開啟時會捲到頂，不用捲動就能看到播放視窗。

---

## 步驟三：讓首頁影片專區 iframe 改載這份

完成步驟一、二後，編輯 **`index.html`**，找到影片專區的 iframe（約第 620 行），把 `src` 改成站內檔案：

- **原本：** `src="https://www.tcawg.com/travel/video.html"`  
- **改為：** `src="video-tcawg-with-fix.html"`

存檔後，首頁的「影片專區」會載入這份站內複本，版型與 TCAWG 一致，但點擊播放時會套用修正，不需捲動即可看到播放視窗。

---

## 若不想做複本

若暫時不想做上述複本，可以維持目前 iframe 仍指向 `https://www.tcawg.com/travel/video.html`，但就無法從我們這邊修正「要捲動才看到」的問題；或可改為 iframe 載入本站的 **`videos.html`**（Contentful 影片列表），點「立即觀看」會開新分頁到 `player.html`，完全不會有捲動問題，只是版面會是本站的影片列表，不是 TCAWG 的版型。
