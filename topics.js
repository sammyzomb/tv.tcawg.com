// topics.js：主題探索功能
(function(){
  // 初始化 Contentful client
  const contentfulClient = contentful.createClient({
    space: 'os5wf90ljenp',
    accessToken: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0'
  });

  // 熱門搜尋標籤
  const POPULAR_TAGS = [
    '日本', '韓國', '台灣', '中國', '泰國', '越南', '馬來西亞', '印尼',
    '歐洲', '法國', '德國', '義大利', '西班牙', '英國', '荷蘭',
    '美國', '加拿大', '澳洲', '紐西蘭', '非洲', '南美洲',
    '自然', '文化', '美食', '冒險', '城市', '度假', '歷史', '藝術'
  ];

  // 搜尋建議
  const SEARCH_SUGGESTIONS = {
    '日本': ['東京', '京都', '大阪', '北海道', '富士山', '溫泉', '櫻花'],
    '韓國': ['首爾', '釜山', '濟州島', '韓劇', '韓食', 'K-pop'],
    '歐洲': ['巴黎', '羅馬', '巴塞隆納', '倫敦', '阿姆斯特丹', '古堡'],
    '美食': ['拉麵', '壽司', '披薩', '義大利麵', '海鮮', '甜點'],
    '自然': ['山脈', '海洋', '森林', '瀑布', '極光', '沙漠']
  };

  // HTML 轉義函數
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 限制文字長度
  function limitText(txt, max) {
    return !txt ? '' : (txt.length > max ? txt.slice(0, max) + '…' : txt);
  }

  // 渲染熱門搜尋標籤
  function renderSearchTags() {
    const container = document.getElementById('search-tags');
    if (!container) return;

    // 只顯示前 16 個標籤，避免分兩行
    const displayTags = POPULAR_TAGS.slice(0, 16);
    
    container.innerHTML = displayTags.map(tag => `
      <span class="search-tag" data-tag="${tag}">${escapeHtml(tag)}</span>
    `).join('');

    // 添加點擊事件
    container.addEventListener('click', handleTagClick);
  }

  // 渲染主題分類卡片
  function renderTopicsGrid() {
    const container = document.getElementById('topics-grid');
    if (!container) return;

    container.innerHTML = TOPICS_DATA.map(topic => `
      <div class="topic-card" data-topic-id="${topic.id}">
        <div class="topic-icon">${topic.icon}</div>
        <div class="topic-title">${escapeHtml(topic.title)}</div>
        <div class="topic-desc">${escapeHtml(topic.description)}</div>
        <div class="topic-stats">
          <span>📺 ${topic.videoCount} 個節目</span>
          <span>🏷️ ${topic.tags.slice(0, 2).join('、')}</span>
        </div>
      </div>
    `).join('');

    // 添加主題卡片點擊事件
    container.addEventListener('click', handleTopicClick);
  }

  // 處理主題卡片點擊
  function handleTopicClick(e) {
    const topicCard = e.target.closest('.topic-card');
    if (!topicCard) return;

    const topicId = topicCard.dataset.topicId;
    const topic = TOPICS_DATA.find(t => t.id === topicId);
    
    if (topic) {
      // 將主題標題填入搜尋框
      const searchInput = document.getElementById('search-input');
      searchInput.value = topic.title;
      
      // 執行搜尋
      performSearch(topic.title);
      
      // 滾動到搜尋結果區域
      const resultsSection = document.getElementById('featured-videos-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // 處理標籤點擊
  function handleTagClick(e) {
    const tag = e.target.closest('.search-tag');
    if (!tag) return;

    const tagText = tag.dataset.tag;
    const searchInput = document.getElementById('search-input');
    
    // 將標籤文字填入搜尋框
    searchInput.value = tagText;
    
    // 移除其他標籤的 active 狀態
    document.querySelectorAll('.search-tag').forEach(t => t.classList.remove('active'));
    
    // 添加當前標籤的 active 狀態
    tag.classList.add('active');
    
    // 執行搜尋
    performSearch(tagText);
  }

  // 執行搜尋
  async function performSearch(query) {
    const container = document.getElementById('featured-videos');
    const section = document.getElementById('featured-videos-section');
    
    if (!container || !section) return;

    // 顯示載入狀態
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280;">搜尋中...</div>';
    section.style.display = 'block';

    try {
      // 從 Contentful 載入節目
      const entries = await contentfulClient.getEntries({
        content_type: 'video',
        order: '-sys.updatedAt',
        limit: 100
      });

      // 篩選符合搜尋條件的節目
      const searchResults = (entries.items || []).filter(item => {
        const fields = item.fields || {};
        const tags = Array.isArray(fields.tags) ? fields.tags : [];
        const title = fields.影片標題 || fields.title || '';
        const desc = fields.精選推薦影片說明文字 || fields.description || '';

        // 檢查標籤、標題或描述是否包含搜尋關鍵字
        const content = `${title} ${desc} ${tags.join(' ')}`.toLowerCase();
        return content.includes(query.toLowerCase());
      });

      // 渲染節目卡片
      if (searchResults.length > 0) {
        container.innerHTML = searchResults.slice(0, 12).map(video => {
          const fields = video.fields || {};
          const title = fields.影片標題 || fields.title || '未命名影片';
          const desc = fields.精選推薦影片說明文字 || fields.description || '';
          const ytid = fields.YouTube_ID || fields.youTubeId || '';
          const tags = Array.isArray(fields.tags) ? fields.tags : [];
          
          let thumb = fields.thumbnail?.fields?.file?.url || '';
          if (thumb && !thumb.startsWith('http')) thumb = 'https:' + thumb;
          if (!thumb && ytid) thumb = `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`;

          return `
            <div class="video-card">
              <div class="video-thumb">
                ${thumb ? `<img src="${thumb}" alt="${escapeHtml(title)}" loading="lazy">` : 
                  `<div style="width:100%;height:100%;background:#e5e7eb;"></div>`}
              </div>
              <div class="video-content">
                ${tags.length ? `<div class="video-tags">${tags.slice(0, 2).map(t => escapeHtml(String(t))).join(' / ')}</div>` : ''}
                <div class="video-title">${escapeHtml(limitText(title, 30))}</div>
                ${desc ? `<div class="video-desc">${escapeHtml(limitText(desc, 50))}</div>` : ''}
                ${ytid ? `<button class="video-cta" data-type="youtube" data-videoid="${ytid}">立即觀看</button>` : ''}
              </div>
            </div>
          `;
        }).join('');
      } else {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #6b7280;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
            <div>沒有找到「${query}」相關的節目</div>
            <div style="font-size: 14px; margin-top: 8px;">請嘗試其他關鍵字</div>
          </div>
        `;
      }

      // 更新標題
      const sectionTitle = section.querySelector('.section-title');
      if (sectionTitle) {
        sectionTitle.textContent = `搜尋結果：${query}`;
      }

    } catch (error) {
      console.error('搜尋失敗：', error);
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6b7280;">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <div>搜尋時發生錯誤</div>
          <div style="font-size: 14px; margin-top: 8px;">請稍後再試</div>
        </div>
      `;
    }
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', () => {
    renderSearchTags();
    setupSearchEvents();
  });

  // 設置搜尋事件
  function setupSearchEvents() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    // 搜尋按鈕點擊事件
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) {
        performSearch(query);
      }
    });

    // 搜尋框按 Enter 鍵事件
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          performSearch(query);
        }
      }
    });

    // 搜尋框輸入事件（即時搜尋）
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length >= 2) {
        searchTimeout = setTimeout(() => {
          performSearch(query);
        }, 500); // 延遲 500ms 避免過於頻繁的搜尋
      }
    });
  }
})();
