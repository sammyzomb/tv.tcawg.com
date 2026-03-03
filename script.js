// 避免文字有 HTML 特殊符號出錯
function escapeHtml(s='') {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// 獲取台灣時間
function getTaiwanTime() {
  // 直接返回當前時間，假設系統時間已經是台灣時間
  return new Date();
}

// 獲取節目狀態
function getProgramStatus(program) {
  const taiwanTime = getTaiwanTime();
  const currentTime = taiwanTime.getHours() * 60 + taiwanTime.getMinutes();
  const currentTimeString = `${taiwanTime.getHours().toString().padStart(2, '0')}:${taiwanTime.getMinutes().toString().padStart(2, '0')}`;
  
  const [programHour, programMinute] = program.time.split(':').map(Number);
  const programStartTime = programHour * 60 + programMinute;
  const programEndTime = programStartTime + parseInt(program.duration);
  
  // 調試輸出
  console.log(`🕐 當前時間: ${currentTimeString} (${currentTime}分鐘)`);
  console.log(`📺 檢查節目 ${program.time} (${program.title}): 開始=${programStartTime}, 結束=${programEndTime}`);
  
  // 簡化邏輯：只檢查當前時間是否在節目時間範圍內
  if (currentTime >= programStartTime && currentTime < programEndTime) {
    console.log(`  -> 現正播放`);
    return 'now-playing'; // 現正播放
  } else if (currentTime < programStartTime) {
    console.log(`  -> 即將播出`);
    return 'upcoming'; // 即將播出
  } else {
    console.log(`  -> 已結束`);
    return 'ended'; // 已結束
  }
}

// 標準化縮圖網址，避免 YouTube 高解析灰圖
function normalizeThumbnailUrl(url, youtubeId) {
  const fallback = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop';
  let finalUrl = url || '';
  if (!finalUrl && youtubeId) {
    finalUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  }
  if (!finalUrl) return fallback;
  if (finalUrl.includes('maxresdefault.jpg')) {
    return finalUrl.replace('maxresdefault.jpg', 'hqdefault.jpg');
  }
  return finalUrl;
}

function mapScheduleItemsToPrograms(items, dateKey) {
  const rawPrograms = (items || []).filter(item => {
    const fields = item.fields || {};
    const title = fields.title || '';
    const airDate = fields.airDate || '';
    const isTargetDate = airDate === dateKey;
    if (!isTargetDate) return false;

    const isRecommendedProgram = title.includes('加拿大的寒冰生活') || 
                                 title.includes('加拿大捕魚') || 
                                 title.includes('加拿大的極光晚餐');
    return !isRecommendedProgram;
  }).map(item => {
    const notes = item.fields.notes || '';
    const timeMatch = notes.match(/\[時間:(\d{2}:\d{2})\]/);
    let timeString;
    
    if (timeMatch) {
      timeString = timeMatch[1];
    } else {
      const block = item.fields.block || '12-18';
      switch (block) {
        case '00-06': timeString = '02:00'; break;
        case '06-12': timeString = '11:30'; break;
        case '12-18': timeString = '14:00'; break;
        case '18-24': timeString = '22:00'; break;
        default: timeString = '14:00';
      }
    }
    
    const video = item.fields.video?.fields || {};
    let youtubeId = '';
    if (video.youtubeId) {
      youtubeId = video.youtubeId.trim();
    } else if (video.youTubeId) {
      youtubeId = video.youTubeId.trim();
    }
    
    const isValidYouTubeId = /^[a-zA-Z0-9_-]{11}$/.test(youtubeId);
    let thumbnail = '';
    if (item.fields.thumbnailUrl) {
      thumbnail = item.fields.thumbnailUrl;
    } else if (video.thumbnail?.fields?.file?.url) {
      thumbnail = video.thumbnail.fields.file.url.startsWith('http') ? 
        video.thumbnail.fields.file.url : 
        `https:${video.thumbnail.fields.file.url}`;
    } else if (video.thumbnail && typeof video.thumbnail === 'string') {
      thumbnail = video.thumbnail;
    } else if (video.coverImage?.fields?.file?.url) {
      thumbnail = `https:${video.coverImage.fields.file.url}`;
    } else if (isValidYouTubeId) {
      thumbnail = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
    } else {
      thumbnail = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop';
    }
    
    let description = '';
    if (notes) {
      description = notes
        .replace(/\[時間:\d{2}:\d{2}\]/g, '')
        .replace(/\[YouTube:[^\]]+\]/g, '')
        .trim();
    }
    if (!description) {
      description = video.description || item.fields.description || '';
    }

    const category = extractCategoryFromNotes(notes) || item.fields.category || video.category || '';
    const topics = extractTopicsFromNotes(notes) || item.fields.topics || [];
    
    return {
      time: timeString,
      title: item.fields.title || '未命名節目',
      duration: '30',
      category: category || '',
      description: description,
      thumbnail: thumbnail,
      youtubeId: youtubeId,
      status: (item.fields.isPremiere === true || item.fields.status === '首播') ? '首播' : '重播',
      tags: topics
    };
  }).sort((a, b) => a.time.localeCompare(b.time));

  const uniquePrograms = [];
  const seenTimes = new Set();
  for (const program of rawPrograms) {
    if (!seenTimes.has(program.time)) {
      seenTimes.add(program.time);
      uniquePrograms.push(program);
    }
  }

  return uniquePrograms;
}

// 以 30 分鐘時段補齊 24 個欄位（可從目前或下一時段開始）
function buildUpcomingSlots(programs, startOffsetSlots = 0, nextDayPrograms = []) {
  const taiwanTime = getTaiwanTime();
  const currentHour = taiwanTime.getHours();
  const currentMinute = taiwanTime.getMinutes();
  const currentTimeSlot = currentMinute < 30 ? 0 : 1;
  const currentHalfHourIndex = currentHour * 2 + currentTimeSlot;
  const baseSlotIndex = currentHalfHourIndex + startOffsetSlots;

  const mapByTime = new Map();
  (programs || []).forEach(p => {
    if (p && p.time) mapByTime.set(p.time, p);
  });
  const mapByTimeNextDay = new Map();
  (nextDayPrograms || []).forEach(p => {
    if (p && p.time) mapByTimeNextDay.set(p.time, p);
  });

  const slots = [];
  for (let i = 0; i < 24; i++) {
    const slotIndex = baseSlotIndex + i;
    const dayOffset = Math.floor(slotIndex / 48);
    const halfHourIndex = slotIndex % 48;
    const hour = Math.floor(halfHourIndex / 2);
    const minute = (halfHourIndex % 2) * 30;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const existing = dayOffset === 0 ? mapByTime.get(timeString) : mapByTimeNextDay.get(timeString);
    if (existing) {
      slots.push({
        ...existing,
        thumbnail: normalizeThumbnailUrl(existing.thumbnail, existing.youtubeId)
      });
    } else {
      slots.push({
        time: timeString,
        title: '目前暫無節目',
        duration: '30',
        category: '',
        description: '此時段暫無節目安排',
        thumbnail: normalizeThumbnailUrl('', ''),
        youtubeId: '',
        status: '空檔',
        tags: []
      });
    }
  }
  return slots;
}

// 初始化 Contentful client
const contentfulClient = contentful.createClient({
  space: 'os5wf90ljenp',
  accessToken: window.CONTENTFUL_CONFIG?.DELIVERY_TOKEN || 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0'
});

// 從備註中提取分類
function extractCategoryFromNotes(notes) {
  if (!notes) return '';
  const match = notes.match(/\[分類:(.*?)\]/);
  return match ? match[1] : '';
}

// 主題探索分類數據
const TOPICS_DATA = [
  {
    id: 'city-secrets',
    title: '城市秘境',
    description: '深入城市角落、市集、文化景點，用實地體驗呈現城市故事'
  },
  {
    id: 'taste-journal',
    title: '味覺日誌',
    description: '品嘗當地料理與街頭小吃，訪問餐廳老闆或廚師，分享食物背後的故事'
  },
  {
    id: 'travel-talk',
    title: '旅途談',
    description: '邀請旅遊達人、部落客、在地人，分享旅行心得、技巧與趣聞'
  },
  {
    id: 'around-world',
    title: '繞著地球跑',
    description: '走訪小鎮或鄉村，介紹當地文化、手作工藝、市場與特色美食'
  },
  {
    id: 'food-talk',
    title: '食話實說',
    description: '討論特定食材、料理或美食文化，結合討論與實地示範'
  },
  {
    id: 'play-fun',
    title: '玩樂FUN',
    description: '專為家庭設計，探索適合親子活動的景點、遊樂園、動物園'
  },
  {
    id: 'culture-heritage',
    title: '文化遺產',
    description: '走訪古蹟、博物館、傳統村落，透過歷史故事呈現深度文化旅程'
  },
  {
    id: 'nature-secrets',
    title: '自然秘境',
    description: '探索自然景觀、野生動植物、生態保育，感受地球之美'
  }
];

// 從備註中提取主題
function extractTopicsFromNotes(notes) {
  if (!notes) return [];
  const matches = notes.match(/\[主題:(.*?)\]/g);
  if (!matches) return [];
  
  // 提取所有主題標記的內容
  const topics = matches.map(m => m.replace(/\[主題:(.*?)\]/, '$1'));
  
  // 如果主題包含逗號分隔的多個主題，則分割它們
  const allTopics = [];
  topics.forEach(topic => {
    if (topic.includes(',')) {
      // 分割逗號分隔的主題
      const splitTopics = topic.split(',').map(t => t.trim()).filter(t => t);
      allTopics.push(...splitTopics);
    } else {
      allTopics.push(topic.trim());
    }
  });
  
  // 將英文 ID 轉換為中文標題
  const translatedTopics = allTopics.map(topicId => {
    const topicData = TOPICS_DATA.find(t => t.id === topicId);
    return topicData ? topicData.title : topicId;
  });
  
  // 去重：移除重複的主題
  const uniqueTopics = [...new Set(translatedTopics)];
  
  return uniqueTopics;
}

// 隱藏載入指示器（在 DOM 載入前就準備好）
function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator && !loadingIndicator.classList.contains('hidden')) {
    console.log('🔄 隱藏載入指示器');
    loadingIndicator.classList.add('hidden');
    setTimeout(() => {
      loadingIndicator.style.display = 'none';
    }, 300);
  }
}

// 盡早隱藏載入指示器
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(hideLoadingIndicator, 300);
  });
} else {
  setTimeout(hideLoadingIndicator, 300);
}

// 備用：確保在頁面完全載入後隱藏
window.addEventListener('load', () => {
  setTimeout(hideLoadingIndicator, 100);
});

document.addEventListener('DOMContentLoaded', () => {
  // === 漢堡選單 ===
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sideMenu = document.getElementById('side-menu');
  const menuOverlay = document.getElementById('menu-overlay');
  const body = document.body;
  function toggleMenu() {
    sideMenu?.classList.toggle('active');
    menuOverlay?.classList.toggle('active');
    body.classList.toggle('menu-open');
  }
  hamburgerBtn?.addEventListener('click', toggleMenu);
  menuOverlay?.addEventListener('click', toggleMenu);

  // === 主題切換 ===
  const themeSwitcher = document.getElementById('theme-switcher');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const themeIconMoon = document.getElementById('theme-icon-moon');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    body.classList.add(savedTheme);
  }
  updateThemeIcon(body.classList.contains('dark-theme') ? 'dark-theme' : '');
  
  themeSwitcher?.addEventListener('click', e => {
    e.preventDefault();
    
    // 如果用戶手動切換主題，則保存設定
    body.classList.toggle('dark-theme');
    const cur = body.classList.contains('dark-theme') ? 'dark-theme' : '';
    localStorage.setItem('theme', cur);
    updateThemeIcon(cur);
    
    // 顯示提示訊息
    showThemeChangeMessage(cur);
  });
  
  // 顯示主題切換提示
  function showThemeChangeMessage(theme) {
    const message = theme === 'dark-theme' ? '已切換到深色主題' : '已切換到淺色主題';
    console.log(`🎨 ${message}`);
    
    // 可以添加一個短暫的提示訊息到頁面上
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--primary-color);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // 顯示動畫
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 100);
    
    // 3秒後移除
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  function updateThemeIcon(theme) {
    if (!themeIconSun || !themeIconMoon) return;
    if (theme === 'dark-theme') {
      themeIconSun.style.display = 'none';
      themeIconMoon.style.display = 'inline-block';
    } else {
      themeIconSun.style.display = 'inline-block';
      themeIconMoon.style.display = 'none';
    }
  }

  // Hero 影片由 media.js 處理

  // === 精選節目（每頁 8 個，支援查看更多；縮圖固定 16:9）===
  (async function loadFeaturedFromCF() {
    const container = document.getElementById('featured-videos');
    if (!container) return;

    // 標籤翻譯映射
    const TAG_TRANSLATIONS = {
      'city-secrets': '城市秘境',
      'around-world': '繞著地球跑',
      'nature-secrets': '自然秘境',
      'taste-journal': '味覺日誌',
      'food-talk': '食話實說',
      'time-travel': '時光漫遊',
      'play-fun': '玩樂FUN',
      'travel-talk': '旅途談'
    };

    // 翻譯標籤函數
    const translateTags = (tags) => {
      if (!Array.isArray(tags)) return [];
      return tags.map(tag => TAG_TRANSLATIONS[tag] || tag);
    };

    // 取第一個有值的欄位
    const pick = (f, keys) => {
      for (const k of keys) {
        if (f && f[k] != null && f[k] !== '') return f[k];
      }
      return '';
    };

    // 文字長度限制：標題 20、描述 30
    const limitText = (txt, max) => !txt ? '' : (txt.length > max ? txt.slice(0, max) + '…' : txt);

    try {
      // 先多抓一些，之後在前端分頁（可視需要調大）
      const entries = await contentfulClient.getEntries({
        content_type: 'video',
        'fields.isFeatured': true,
        order: '-sys.updatedAt',
        limit: 100
      });

      const allItems = (entries.items || []).map(it => {
        const f = it.fields || {};
        const title = pick(f, ['影片標題','title']);
        const desc  = pick(f, ['精選推薦影片說明文字','description']);
        const ytid  = pick(f, ['YouTube ID','youTubeId']);
        const mp4   = pick(f, ['MP4 影片網址','mp4Url']);
        const tags  = translateTags(Array.isArray(f.tags) ? f.tags : []);

        // 縮圖：優先 Contentful 圖，否則用 YouTube 預設圖
        let thumb = '';
        const cfThumb = f.thumbnail?.fields?.file?.url;
        if (cfThumb) thumb = cfThumb.startsWith('http') ? cfThumb : `https:${cfThumb}`;
        else if (ytid) thumb = `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`;

        return { title, desc, ytid, mp4, tags, thumb };
      });

      // 分頁渲染
      const PAGE_SIZE = 8;
      let rendered = 0;

      // 不再顯示「所有節目」按鈕（已依需求移除）
      function renderNextPage() {
        const slice = allItems.slice(rendered, rendered + PAGE_SIZE);
        if (!slice.length) return;

        const frag = document.createDocumentFragment();
        slice.forEach(v => {
          const card = document.createElement('div');
          card.className = 'video-card';
          card.innerHTML = `
            <div class="video-thumb" style="aspect-ratio:16/9; width:100%; overflow:hidden; border-radius:14px; background:var(--card-bg);">
              ${v.thumb ? `<img src="${v.thumb}" alt="${escapeHtml(v.title)}"
                  style="width:100%;height:100%;object-fit:cover;display:block;"
                  onerror="this.onerror=null;this.src='${v.ytid ? `https://i.ytimg.com/vi/${v.ytid}/hqdefault.jpg` : ''}';">`
                        : `<div style="width:100%;height:100%;background:var(--card-bg);"></div>`}
            </div>
            <div class="video-content">
              ${v.tags?.length ? `<div class="video-tags">${v.tags.join(' / ')}</div>` : ``}
              <div class="video-title">${escapeHtml(limitText(v.title || '未命名影片', 20))}</div>
              ${v.desc ? `<div class="video-desc">${escapeHtml(limitText(v.desc, 30))}</div>` : ``}
              ${
                v.ytid
                  ? `<button class="video-cta" data-type="youtube" data-videoid="${v.ytid}">立即觀看</button>`
                  : (v.mp4 ? `<a class="video-cta" href="${v.mp4}" target="_blank" rel="noopener">播放 MP4</a>` : ``)
              }
            </div>`;
          frag.appendChild(card);
        });

        container.appendChild(frag);
        rendered += slice.length;
      }

      // 首次渲染
      container.innerHTML = '';
      if (allItems.length === 0) {
        container.innerHTML = `<p style="color:#999;">目前無法載入精選節目。</p>`;
      } else {
        renderNextPage(); // 第 1 頁
      }
    } catch (err) {
      console.error('Contentful 連線失敗（featured）：', err);
      if (container) container.innerHTML = `<p style="color:#999;">目前無法載入精選節目。</p>`;
    }
  })();
  
  /* ===== 即將播出 v2.2w｜標準版（自動偵測欄位 + 星期·時間 + 圖片 fallback）===== */
(function UpNext_v22w(){
  const grid = document.getElementById('schedule-spotlight');
  if (!grid) return;

  const cf = (typeof contentfulClient !== 'undefined') ? contentfulClient : null;
  if (!cf){ console.warn('[upnext] contentfulClient not found'); return; }

  // 先上樣式與骨架（避免閃白）
  injectLocalStyles();
  grid.innerHTML = `<div class="spot-skel"></div><div class="spot-skel"></div><div class="spot-skel"></div><div class="spot-skel"></div>`;

  // Utils
  const esc = s => String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  const oneLine = s => (s||'').replace(/\s+/g,' ').trim();
  const ellipsis = (s,n)=>{ s = oneLine(s); return s.length>n ? s.slice(0,n).trim()+'…' : s; };
  const hhmm = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  const BLOCK_START = { '00-06':0,'06-12':6,'12-18':12,'18-24':18 };
  const BLOCK_LABEL = { '00-06':'00–06','06-12':'06–12','12-18':'12–18','18-24':'18–24' };
  const BLOCK_CLASS = { '00-06':'blk-00','06-12':'blk-06','12-18':'blk-12','18-24':'blk-18' };

  function normalizeBlock(v){
    if(!v) return '';
    v = String(v).trim().replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\s+/g,'');
    const map={ '0-6':'00-06','00-6':'00-06','6-12':'06-12','12-18':'12-18','18-24':'18-24' };
    return map[v]||v;
  }
  function fmtDate(d){
    const w = ['週日','週一','週二','週三','週四','週五','週六'][d.getDay()];
    const m  = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${m}.${dd} ${w}`;   // 例：08.19 週一
  }
  function bestThumb(vf, field){
    const u = vf?.[field]?.fields?.file?.url;
    if (u) return u.startsWith('http') ? u : ('https:'+u);
    const yid = vf?.youTubeId || vf?.youtubeId || vf?.YouTubeID;
    if (yid) return `https://i.ytimg.com/vi/${yid}/hqdefault.jpg`;
    return 'https://picsum.photos/1200/675?blur=2';
  }

  // 抓全部後在前端挑「未來的最近 3–4 筆」
  // 暫時停用 Contentful 載入，避免載入假節目資料
  // cf.getEntries({ content_type:'scheduleItem', include:2, limit:1000, order:'fields.airDate' })
  //   .then(res=>{
  //     const items = res.items||[];
  //     if (!items.length){ return showEmpty(); }
  
  // 直接顯示空狀態，避免載入假節目
  showEmpty();

  // 註解掉整個 Contentful 程式碼區塊，避免載入假節目資料
  /*
      // 自動偵測欄位 ID
      const sample = items.find(x=>x?.fields) || items[0];
      const keys = Object.keys(sample.fields||{});
      const guessKey = (tester) => {
        for (const k of keys){
          let ok=0; for (const it of items){ if (tester(it.fields?.[k])) { ok++; if (ok>=3) break; } }
          if (ok>=3) return k;
        }
        return null;
      };
      const FIELD = {
        schedule: {
          title: 'title',
          airDate:    guessKey(v=>typeof v==='string' && /^\d{4}-\d{2}-\d{2}/.test(v)) || 'airDate',
          block:      guessKey(v=>typeof v==='string' && /(\d{1,2}\s*[-–]\s*\d{1,2})/.test(v)) || 'block',
          slotIndex:  guessKey(v=>typeof v==='number' && v>=0 && v<=11) || 'slotIndex',
          video:      guessKey(v=> (v && typeof v==='object' && v.fields) || (Array.isArray(v) && v[0]?.fields)) || 'video',
          isPremiere: guessKey(v=>typeof v==='boolean') || 'isPremiere'
        },
        video: { title:'title', description:'description', thumbnail:'thumbnail', youtubeId:'youTubeId' }
      };
      // 找出影片裡真正裝 Asset 的欄位，以及可能的 youtubeId 欄位
      const anyVideo =
        (items.find(it=>it.fields?.[FIELD.schedule.video]?.fields)?.fields?.[FIELD.schedule.video]?.fields) ||
        (items.find(it=>Array.isArray(it.fields?.[FIELD.schedule.video]))?.fields?.[FIELD.schedule.video]?.[0]?.fields);
      if (anyVideo){
        for (const k of Object.keys(anyVideo)){ if (anyVideo[k]?.fields?.file?.url){ FIELD.video.thumbnail = k; break; } }
        if (!('youTubeId' in anyVideo) && !('youtubeId' in anyVideo)){
          FIELD.video.youtubeId = ['youTubeId','youtubeId','YouTubeID','ytId'].find(k=>k in anyVideo) || FIELD.video.youtubeId;
        }
      }
      console.info('[upnext] keys:', FIELD);

      // 整理 rows
      const now = new Date();
      const rows = [];
      items.forEach(it=>{
        const f = it.fields||{};
        const air = f[FIELD.schedule.airDate];
        const blk = normalizeBlock(f[FIELD.schedule.block]);
        const slot = Number(f[FIELD.schedule.slotIndex]||0);
        const vref = f[FIELD.schedule.video];
        if (!air || !blk || isNaN(slot) || !vref) return;

        const begin = new Date(air);
        begin.setHours(BLOCK_START[blk] ?? 0, 0, 0, 0);
        begin.setMinutes(begin.getMinutes() + slot*30);
        if (begin <= now) return;

        const vf = (Array.isArray(vref) ? vref[0] : vref)?.fields;
        if (!vf) return;

        const title = vf[FIELD.video.title] || f[FIELD.schedule.title] || '未命名節目';
        const desc  = vf[FIELD.video.description] || '';
        const img   = bestThumb(vf, FIELD.video.thumbnail);

        rows.push({
          at: begin.getTime(),
          date: fmtDate(begin),             // ★ 含星期
          time: hhmm(begin),
          block: blk,
          isPremiere: !!f[FIELD.schedule.isPremiere],
          title: oneLine(title),
          desc:  ellipsis(desc, 72),
          img,
          href: 'videos.html'
        });
      });

      rows.sort((a,b)=>a.at-b.at);
      const list = rows.slice(0, rows.length>=4 ? 4 : Math.min(rows.length,3));
      if (!list.length) return showEmpty();

      grid.innerHTML = list.map((r,i)=>`
        <a class="spot-card ${BLOCK_CLASS[r.block]||'blk-12'}" href="${r.href}" style="animation-delay:${i*0.05}s">
          <img class="spot-img" loading="lazy" src="${r.img}"
               onerror="this.onerror=null;this.src='https://picsum.photos/1200/675?blur=2';" alt="">
          <div class="spot-grad"></div>
          <div class="spot-chip spot-time">${r.date} · ${r.time}</div>   <!-- ★ 星期 · 時間 -->
          <div class="spot-chip spot-block">${BLOCK_LABEL[r.block]||''}</div>
          ${r.isPremiere ? `<div class="spot-badge">首播</div>` : ``}
          <div class="spot-meta">
            <div class="spot-title">${esc(r.title)}</div>
            <div class="spot-desc">${esc(r.desc)}</div>
          </div>
        </a>
      `).join('');
    })
    .catch(err=>{ console.error('[upnext] load error', err); showEmpty(); });
  */

  function showEmpty(){
    grid.innerHTML = `
      <div class="spot-empty">
        目前沒有即將播出的節目
        <a class="spot-btn" href="schedule.html">查看完整節目表</a>
      </div>`;
  }

  function injectLocalStyles(){
    const old = document.getElementById('upnext-v2-style'); if (old) old.remove();
    const css = document.createElement('style'); css.id='upnext-v2-style';
    css.textContent = `
      .schedule-spotlight-grid{display:grid;gap:20px;grid-template-columns:repeat(3,minmax(0,1fr))}
      @media(min-width:1400px){.schedule-spotlight-grid{grid-template-columns:repeat(4,1fr)}}
      @media(max-width:900px){.schedule-spotlight-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:640px){.schedule-spotlight-grid{grid-template-columns:1fr}}
      .spot-card{position:relative;display:block;border-radius:20px;border:1px solid rgba(0,0,0,.06);
                 box-shadow:0 10px 24px rgba(0,0,0,.06);transform:translateY(6px);opacity:0;animation:upfade .32s ease forwards}
      @media(prefers-color-scheme:dark){.spot-card{border-color:rgba(255,255,255,.12);box-shadow:0 14px 32px rgba(0,0,0,.25)}}
      .spot-card:hover{transform:translateY(0) scale(1.01)}
      .spot-img{width:100%;aspect-ratio:16/9;height:auto;object-fit:cover;display:block;filter:brightness(.94);border-radius:20px 20px 0 0}
      .spot-grad{position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 15%, rgba(0,0,0,.75) 100%)}
      .spot-meta{position:absolute;left:16px;right:16px;bottom:20px;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.35);max-height:100px;overflow:visible}
      .spot-title{font-weight:800;font-size:14px;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:2px}
      .spot-desc{opacity:.95;font-size:11px;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3}
      @media(max-width:640px){.spot-desc{display:none}}
      .spot-chip{position:absolute;padding:6px 10px;border-radius:999px;font-weight:900;font-size:12px;color:#fff;
                 backdrop-filter:saturate(140%) blur(4px);border:1px solid rgba(255,255,255,.22)}
      .spot-time{left:12px;bottom:85px;background:rgba(8,8,8,.45)}
      .spot-block{right:12px;top:12px}
      .spot-badge{position:absolute;left:12px;top:12px;background:rgba(224,180,106,.95);color:#111;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;border:1px solid rgba(0,0,0,.2)}
      .blk-00 .spot-block{background:linear-gradient(135deg,#4b79a1,#283e51)}
      .blk-06 .spot-block{background:linear-gradient(135deg,#2ea043,#0f5132)}
      .blk-12 .spot-block{background:linear-gradient(135deg,#d39e38,#8c6c1a)}
      .blk-18 .spot-block{background:linear-gradient(135deg,#2563eb,#0f1e5a)}
      .spot-skel{aspect-ratio:16/9;border-radius:20px;background:linear-gradient(90deg, rgba(0,0,0,.05), rgba(0,0,0,.1), rgba(0,0,0,.05));animation:sk 1.2s ease-in-out infinite alternate}
      @media(prefers-color-scheme:dark){.spot-skel{background:linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.1), rgba(255,255,255,.06))}}
      .spot-empty{grid-column:1/-1;padding:22px;border:1px dashed rgba(0,0,0,.18);border-radius:14px;text-align:center}
      .spot-btn{margin-left:8px;display:inline-block;padding:8px 12px;border-radius:999px;border:1px solid rgba(0,0,0,.22);text-decoration:none;font-weight:800}
      @keyframes sk{to{filter:brightness(1.15)}}
      @keyframes upfade{to{opacity:1;transform:translateY(0)}}
    `;
    document.head.appendChild(css);
  }
})();




  // 全螢幕播放器由 media.js 處理

  // === 節目時間表功能（Contentful 版本）===
  let scheduleData = null;
  let currentTimeUpdateInterval = null;

  // 載入節目時間表數據
  async function loadScheduleData() {
    try {
      // 獲取台灣時間
      const taiwanTime = getTaiwanTime();
      const currentMonth = taiwanTime.toISOString().slice(0, 7); // YYYY-MM 格式
      const today = taiwanTime.toISOString().split('T')[0]; // YYYY-MM-DD 格式
      const tomorrowDate = new Date(taiwanTime);
      tomorrowDate.setDate(taiwanTime.getDate() + 1);
      const tomorrow = tomorrowDate.toISOString().split('T')[0];
      const currentHour = taiwanTime.getHours();
      
      console.log('正在載入節目表，月份:', currentMonth, '日期:', today, '當前時間:', currentHour + ':' + taiwanTime.getMinutes());
      console.log('台灣時間詳情:', taiwanTime.toLocaleString('zh-TW', {timeZone: 'Asia/Taipei'}));
      
      // 強制清除所有快取資料，確保使用最新的過濾邏輯
      console.log('🔧 強制清除快取，重新載入節目表');
      scheduleData = null;
      
      // 清除所有可能的快取資料
      try {
        localStorage.removeItem('currentSchedule');
        localStorage.removeItem('calendar_events');
        localStorage.removeItem('scheduleData');
        console.log('✅ 已清除所有 localStorage 快取資料');
      } catch (e) {
        console.log('清除 localStorage 快取時發生錯誤:', e);
      }
      
      // 優先從 Contentful 載入節目表
      try {
        console.log('🎯 優先從 Contentful 載入節目表...');
        const response = await contentfulClient.getEntries({
          content_type: 'scheduleItem',
          'fields.airDate': today,
          order: 'fields.airDate,fields.slotIndex',
          include: 2,
          limit: 100
        });
        
        console.log('Contentful 回應:', response.items?.length || 0, '個項目');
        console.log('查詢日期:', today);
        
        if (response.items && response.items.length > 0) {
          // 過濾節目：只顯示今天的節目，並排除推薦節目
          const todayPrograms = response.items.filter(item => {
            const fields = item.fields || {};
            const title = fields.title || '';
            const airDate = fields.airDate || '';
            
            // 只顯示今天的節目
            const isToday = airDate === today;
            if (!isToday) {
              console.log('跳過非今日節目:', airDate, title);
              return false;
            }
            
            // 排除推薦節目（包含特定關鍵字的節目）
            const isRecommendedProgram = title.includes('加拿大的寒冰生活') || 
                                       title.includes('加拿大捕魚') || 
                                       title.includes('加拿大的極光晚餐');
            
            return !isRecommendedProgram;
          }).map(item => {
            // 從備註中提取具體時間，格式為 [時間:XX:XX]
            const notes = item.fields.notes || '';
            const timeMatch = notes.match(/\[時間:(\d{2}:\d{2})\]/);
            let timeString;
            
            if (timeMatch) {
              // 使用備註中的具體時間
              timeString = timeMatch[1];
            } else {
              // 如果沒有具體時間，使用時段轉換
              const block = item.fields.block || '12-18';
              switch (block) {
                case '00-06': timeString = '02:00'; break;
                case '06-12': timeString = '11:30'; break;
                case '12-18': timeString = '14:00'; break;
                case '18-24': timeString = '22:00'; break;
                default: timeString = '14:00';
              }
            }
            
            // 從 video 欄位獲取影片資訊
            const video = item.fields.video?.fields || {};
            
            // 提取和驗證 YouTube ID
            let youtubeId = '';
            if (video.youtubeId) {
              youtubeId = video.youtubeId.trim();
            } else if (video.youTubeId) {
              youtubeId = video.youTubeId.trim();
            }
            
            // 驗證 YouTube ID 格式（應該是11個字符的字母數字組合）
            const isValidYouTubeId = /^[a-zA-Z0-9_-]{11}$/.test(youtubeId);
            if (!isValidYouTubeId && youtubeId) {
              console.warn('無效的 YouTube ID 格式:', youtubeId, 'for program:', item.fields.title);
              youtubeId = ''; // 清空無效的 ID
            }
            
            // 處理縮圖：優先使用 item.fields.thumbnailUrl，然後是 video.thumbnail，最後是 YouTube 縮圖
            let thumbnail = null;
            
            // 1. 優先使用 item.fields.thumbnailUrl
            if (item.fields.thumbnailUrl) {
              thumbnail = item.fields.thumbnailUrl;
            }
            // 2. 使用 video.thumbnail Asset
            else if (video.thumbnail?.fields?.file?.url) {
              thumbnail = video.thumbnail.fields.file.url.startsWith('http') ? 
                video.thumbnail.fields.file.url : 
                `https:${video.thumbnail.fields.file.url}`;
            }
            // 3. 使用 YouTube 縮圖（只有當 YouTube ID 有效時）
            else if (isValidYouTubeId) {
              thumbnail = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
            }
            // 4. 預設縮圖
            else {
              thumbnail = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop';
            }
            
            // 從 notes 欄位中提取節目描述
            // notes 格式通常是：[時間:XX:XX] [YouTube:ID] 描述文字
            let description = '';
            if (notes) {
              // 移除時間標記和 YouTube 標記，保留描述文字
              description = notes
                .replace(/\[時間:\d{2}:\d{2}\]/g, '')
                .replace(/\[YouTube:[^\]]+\]/g, '')
                .trim();
            }
            
            // 如果 notes 中沒有描述，再檢查其他欄位
            if (!description) {
              if (video.description) {
                description = video.description;
              } else if (video.節目描述) {
                description = video.節目描述;
              } else if (video.影片描述) {
                description = video.影片描述;
              } else if (item.fields.description) {
                description = item.fields.description;
              } else if (item.fields.節目描述) {
                description = item.fields.節目描述;
              }
            }
            
            // 調試縮圖、YouTube ID 和描述處理
            console.log('處理節目數據 (v2.8):', item.fields.title, {
              hasItemThumbnailUrl: !!(item.fields.thumbnailUrl),
              hasVideoThumbnail: !!(video.thumbnail?.fields?.file?.url),
              rawYoutubeId: video.youtubeId || video.youTubeId,
              processedYoutubeId: youtubeId,
              isValidYouTubeId: isValidYouTubeId,
              finalThumbnail: thumbnail,
              notes: notes,
              videoDescription: video.description,
              videoDescriptionChinese: video.節目描述,
              videoDescriptionChinese2: video.影片描述,
              itemDescription: item.fields.description,
              itemDescriptionChinese: item.fields.節目描述,
              finalDescription: description
            });
            
            // 從備註中提取分類和主題
            const category = extractCategoryFromNotes(notes);
            let topics = extractTopicsFromNotes(notes);
            
            console.log('🔍 檢查 topics 數據:', {
              itemFieldsTopics: item.fields.topics,
              videoTopics: video.topics,
              extractedTopics: topics,
              extractedCategory: category,
              itemFieldsKeys: Object.keys(item.fields),
              videoKeys: Object.keys(video)
            });
            
            // 如果沒有從備註中提取到主題，則使用原有的邏輯
            if (!topics || topics.length === 0) {
              if (item.fields.topics && Array.isArray(item.fields.topics)) {
                // 將英文 ID 轉換為中文標題
                topics = item.fields.topics.map(topicId => {
                  const topicData = TOPICS_DATA.find(t => t.id === topicId);
                  return topicData ? topicData.title : topicId;
                });
              } else if (video.topics && Array.isArray(video.topics)) {
                // 將英文 ID 轉換為中文標題
                topics = video.topics.map(topicId => {
                  const topicData = TOPICS_DATA.find(t => t.id === topicId);
                  return topicData ? topicData.title : topicId;
                });
              }
            }
            
            // 如果沒有 topics，根據節目標題生成一些預設標籤
            if (topics.length === 0) {
              const title = item.fields.title || '';
              const description = item.fields.notes || '';
              const fullText = (title + ' ' + description).toLowerCase();
              
              if (fullText.includes('極光') || fullText.includes('aurora') || fullText.includes('北極光')) {
                topics = ['自然秘境'];
              } else if (fullText.includes('japan') || fullText.includes('日本') || fullText.includes('tokyo') || fullText.includes('京都')) {
                topics = ['城市秘境', '時光漫遊'];
              } else if (fullText.includes('加拿大') || fullText.includes('canada') || fullText.includes('楓葉')) {
                topics = ['自然秘境', '繞著地球跑'];
              } else if (fullText.includes('italy') || fullText.includes('義大利') || fullText.includes('羅馬') || fullText.includes('威尼斯')) {
                topics = ['城市秘境', '時光漫遊'];
              } else if (fullText.includes('美食') || fullText.includes('料理') || fullText.includes('餐廳') || fullText.includes('小吃')) {
                topics = ['味覺日誌', '食話實說'];
              } else if (fullText.includes('親子') || fullText.includes('家庭') || fullText.includes('遊樂園') || fullText.includes('動物園')) {
                topics = ['玩樂FUN'];
              } else if (fullText.includes('古蹟') || fullText.includes('博物館') || fullText.includes('歷史') || fullText.includes('文化')) {
                topics = ['時光漫遊', '城市秘境'];
              } else if (fullText.includes('小鎮') || fullText.includes('鄉村') || fullText.includes('市場') || fullText.includes('工藝')) {
                topics = ['繞著地球跑'];
              } else if (fullText.includes('自然') || fullText.includes('風景') || fullText.includes('山') || fullText.includes('海') || fullText.includes('森林')) {
                topics = ['自然秘境'];
              } else {
                topics = ['城市秘境', '旅途談'];
              }
            }
            
            return {
              time: timeString,
              title: item.fields.title || '未命名節目',
              duration: '30', // 預設30分鐘
              category: category || video.category || '',
              description: description,
              thumbnail: thumbnail,
              youtubeId: youtubeId,
              status: (item.fields.isPremiere === true || item.fields.status === '首播') ? '首播' : '重播',
              tags: topics
            };
          }).sort((a, b) => {
            // 按時間排序
            return a.time.localeCompare(b.time);
          });
          
          // 去重：移除重複的節目（基於時段，每個時段只保留第一個節目）
          const uniquePrograms = [];
          const seenTimes = new Set();
          
          for (const program of todayPrograms) {
            if (!seenTimes.has(program.time)) {
              seenTimes.add(program.time);
              uniquePrograms.push(program);
            } else {
              console.log('移除重複時段節目:', program.time, program.title);
            }
          }
          
          console.log('去重前節目數量:', todayPrograms.length);
          console.log('去重後節目數量:', uniquePrograms.length);

          let tomorrowPrograms = [];
          try {
            const tomorrowResponse = await contentfulClient.getEntries({
              content_type: 'scheduleItem',
              'fields.airDate': tomorrow,
              order: 'fields.airDate,fields.slotIndex',
              include: 2,
              limit: 100
            });
            if (tomorrowResponse.items && tomorrowResponse.items.length > 0) {
              tomorrowPrograms = mapScheduleItemsToPrograms(tomorrowResponse.items, tomorrow);
              console.log('成功載入隔天節目，共', tomorrowPrograms.length, '個節目');
            }
          } catch (tomorrowError) {
            console.log('隔天節目載入失敗:', tomorrowError.message);
          }
          
          // 設定全域 scheduleData 變數
          window.scheduleData = {
            today: {
              date: today,
              dayOfWeek: getDayOfWeek(taiwanTime),
              month: `${taiwanTime.getMonth() + 1}月`,
              day: `${taiwanTime.getDate()}日`,
              schedule: uniquePrograms
            },
            tomorrow: {
              date: tomorrow,
              dayOfWeek: getDayOfWeek(tomorrowDate),
              month: `${tomorrowDate.getMonth() + 1}月`,
              day: `${tomorrowDate.getDate()}日`,
              schedule: tomorrowPrograms
            }
          };
          
          // 同時設定本地變數
          scheduleData = window.scheduleData;
          
          console.log('成功從 Contentful 載入節目表，共', scheduleData.today.schedule.length, '個節目');
        } else {
          // 如果沒有找到節目，使用預設數據
          window.scheduleData = {
            today: {
              date: today,
              dayOfWeek: getDayOfWeek(taiwanTime),
              month: `${taiwanTime.getMonth() + 1}月`,
              day: `${taiwanTime.getDate()}日`,
              schedule: getDefaultSchedule(today)
            },
            tomorrow: {
              date: tomorrow,
              dayOfWeek: getDayOfWeek(tomorrowDate),
              month: `${tomorrowDate.getMonth() + 1}月`,
              day: `${tomorrowDate.getDate()}日`,
              schedule: []
            }
          };
          scheduleData = window.scheduleData;
          console.log('Contentful 中沒有找到節目，使用預設節目表');
        }
      } catch (contentfulError) {
        console.log('❌ Contentful 載入失敗，以 Contentful 為基準，不使用備用數據:', contentfulError.message);
        
        // 以 Contentful 為基準，不使用 schedule.json 備用數據
        // 如果 Contentful 載入失敗，顯示空檔
        console.log('📺 以 Contentful 為基準，顯示空檔節目表');
        window.scheduleData = {
          today: {
            date: today,
            dayOfWeek: getDayOfWeek(taiwanTime),
            month: `${taiwanTime.getMonth() + 1}月`,
            day: `${taiwanTime.getDate()}日`,
            schedule: getDefaultSchedule(today)
          }
        };
        scheduleData = window.scheduleData;
      }
      
      updateScheduleDisplay();
      startTimeUpdates();
      
    } catch (error) {
      console.error('從 Contentful 載入節目表失敗:', error);
      
      // 嘗試從 localStorage 載入備用數據
      console.log('🔄 嘗試從 localStorage 載入備用節目數據...');
      
      // 檢查 currentSchedule 中的節目
      const currentSchedule = localStorage.getItem('currentSchedule');
      if (currentSchedule) {
        try {
          const scheduleData = JSON.parse(currentSchedule);
          const todaySchedule = scheduleData.today?.schedule || [];
          
          if (todaySchedule.length > 0) {
            console.log('✅ 從 currentSchedule 載入備用節目，共', todaySchedule.length, '個節目');
            
            // 過濾已結束的節目
            const filteredPrograms = todaySchedule.filter(program => {
              const taiwanTime = getTaiwanTime();
              const currentTime = taiwanTime.getHours() * 60 + taiwanTime.getMinutes();
              
              const [programHour, programMinute] = program.time.split(':').map(Number);
              const programStartTime = programHour * 60 + programMinute;
              const programEndTime = programStartTime + parseInt(program.duration);
              
              return currentTime < programEndTime;
            }).sort((a, b) => a.time.localeCompare(b.time));
            
            window.scheduleData = {
              today: {
                date: today,
                dayOfWeek: getDayOfWeek(taiwanTime),
                month: `${taiwanTime.getMonth() + 1}月`,
                day: `${taiwanTime.getDate()}日`,
                schedule: filteredPrograms
              }
            };
            scheduleData = window.scheduleData;
            
            console.log('使用 currentSchedule 備用節目表，過濾後共', filteredPrograms.length, '個節目');
            updateScheduleDisplay();
            startTimeUpdates();
            return;
          }
        } catch (e) {
          console.log('currentSchedule 備用數據解析失敗:', e);
        }
      }
      
      // 檢查管理後台添加的節目
      const calendarEvents = localStorage.getItem('calendar_events');
      if (calendarEvents) {
        try {
          const eventsData = JSON.parse(calendarEvents);
          const todayEvents = eventsData[today] || [];
          
          if (todayEvents.length > 0) {
            console.log('✅ 從 calendar_events 載入備用節目，共', todayEvents.length, '個節目');
            
            // 將 localStorage 中的節目轉換為節目表格式
            const schedulePrograms = todayEvents.map(event => {
              let timeString = event.time;
              if (!timeString) {
                const notes = event.notes || '';
                const timeMatch = notes.match(/\[時間:(\d{2}:\d{2})\]/);
                timeString = timeMatch ? timeMatch[1] : '14:00';
              }
              
              let thumbnail = event.thumbnail;
              if (!thumbnail && event.youtubeId) {
                thumbnail = `https://i.ytimg.com/vi/${event.youtubeId}/hqdefault.jpg`;
              }
              if (!thumbnail) {
                thumbnail = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop';
              }
              
              return {
                time: timeString,
                title: event.title || '未命名節目',
                duration: event.duration || '30',
                category: event.category || '旅遊',
                description: event.description || '',
                thumbnail: thumbnail,
                youtubeId: event.youtubeId || '',
                status: event.isPremiere ? '首播' : '重播',
                tags: event.tags || []
              };
            }).filter(program => {
              const taiwanTime = getTaiwanTime();
              const currentTime = taiwanTime.getHours() * 60 + taiwanTime.getMinutes();
              const [programHour, programMinute] = program.time.split(':').map(Number);
              const programStartTime = programHour * 60 + programMinute;
              const programEndTime = programStartTime + parseInt(program.duration);
              return currentTime < programEndTime;
            }).sort((a, b) => a.time.localeCompare(b.time));
            
            window.scheduleData = {
              today: {
                date: today,
                dayOfWeek: getDayOfWeek(taiwanTime),
                month: `${taiwanTime.getMonth() + 1}月`,
                day: `${taiwanTime.getDate()}日`,
                schedule: schedulePrograms
              }
            };
            scheduleData = window.scheduleData;
            
            console.log('使用 calendar_events 備用節目表，共', scheduleData.today.schedule.length, '個節目');
            updateScheduleDisplay();
            startTimeUpdates();
            return;
          }
        } catch (e) {
          console.log('calendar_events 備用數據解析失敗:', e);
        }
      }
      
      // 如果所有載入都失敗，使用預設數據
      console.log('⚠️ 所有數據載入都失敗，使用預設節目表');
      const taiwanTime = getTaiwanTime();
      window.scheduleData = {
        today: {
          date: taiwanTime.toISOString().split('T')[0],
          dayOfWeek: getDayOfWeek(taiwanTime),
          month: `${taiwanTime.getMonth() + 1}月`,
          day: `${taiwanTime.getDate()}日`,
          schedule: getDefaultSchedule(taiwanTime.toISOString().split('T')[0])
        }
      };
      scheduleData = window.scheduleData;
      updateScheduleDisplay();
      startTimeUpdates();
    }
  }

  // 預設節目表（當沒有真實節目時使用）
  function getDefaultSchedule(date) {
    console.log('📺 以 Contentful 為基準，沒有找到節目資料，顯示空檔節目表');
    
    const taiwanTime = getTaiwanTime();
    const currentHour = taiwanTime.getHours();
    const currentMinute = taiwanTime.getMinutes();
    
    // 計算當前時段（每30分鐘一個時段）
    const currentTimeSlot = currentMinute < 30 ? 0 : 1;
    const startHour = currentHour;
    
    const programs = [];
    
    // 生成12個小時的節目（24個時段，每小時2個），從當前時段開始
    for (let i = 0; i < 24; i++) {
      const hour = (startHour + Math.floor(i / 2)) % 24; // 處理跨日情況
      const minute = ((currentTimeSlot + i) % 2) * 30; // 從當前時段開始
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // 調試輸出
      console.log(`生成空檔節目: ${timeString} (i=${i}, hour=${hour}, minute=${minute})`);
      
      programs.push({
        time: timeString,
        title: "目前暫無節目",
        duration: "30",
        category: "空檔",
        description: "此時段暫無節目安排",
        thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
        youtubeId: "",
        status: "空檔",
        tags: []
      });
    }
    
    console.log('生成的空檔節目表:', programs.map(p => p.time));
    return programs;
  }

  // 更新節目時間表顯示
  function updateScheduleDisplay() {
    if (!scheduleData) return;

    const { today } = scheduleData;
    
    // 更新日期顯示（使用台灣時間）
    const currentDateTimeEl = document.getElementById('currentDateTime');
    const programCountEl = document.getElementById('program-count');

    // 獲取台灣時間的日期信息
    const taiwanTime = getTaiwanTime();
    const currentMonth = taiwanTime.getUTCMonth() + 1;
    const currentDay = taiwanTime.getUTCDate();
    const currentDayOfWeek = getDayOfWeek(taiwanTime);
    const timeString = getCurrentTimeString();

    if (currentDateTimeEl) {
      currentDateTimeEl.textContent = `${currentMonth}月${currentDay}日 ${currentDayOfWeek} 現在時間 ${timeString}`;
    }

    // 更新即將播出節目數量（包含空檔時段）
    const upcomingCountEl = document.getElementById('upcoming-count');
    if (upcomingCountEl && today.schedule) {
      const filledPrograms = buildUpcomingSlots(
        today.schedule,
        0,
        scheduleData?.tomorrow?.schedule || []
      );
      const upcomingPrograms = filledPrograms.filter(program => {
        try {
          return getProgramStatus(program) === 'upcoming';
        } catch (error) {
          return program.status === 'upcoming';
        }
      });
      upcomingCountEl.textContent = `共 ${upcomingPrograms.length} 個節目`;
    }

    // 檢查是否為TLC風格版型
    const tlcContainer = document.querySelector('.tlc-schedule-container');
    if (tlcContainer) {
      // TLC風格版型渲染
      console.log('🎯 檢測到TLC風格版型，開始渲染');
      console.log('📋 今日節目數據:', today.schedule);
      const filledPrograms = buildUpcomingSlots(today.schedule || []);
      renderTLCStyleSchedule(filledPrograms);
      return;
    }

    // 更新節目列表（現代電視台設計）
    if (scheduleListEl && today.schedule) {
      scheduleListEl.innerHTML = '';
      
      // 顯示所有節目，包括已結束的節目
      const visiblePrograms = today.schedule;
      
      // 生成節目表（只顯示當前時段和未來的節目）
      const taiwanTime = getTaiwanTime();
      const currentHour = taiwanTime.getHours();
      const currentMinute = taiwanTime.getMinutes();
      
      // 計算當前時段（每30分鐘一個時段）
      const currentTimeSlot = currentMinute < 30 ? 0 : 1;
      const startHour = currentHour;
      const startMinute = currentTimeSlot * 30;
      
      const fullSchedule = [];
      
      // 只顯示有節目的時段
      visiblePrograms.forEach(program => {
        const [programHour, programMinute] = program.time.split(':').map(Number);
        const programStartTime = programHour * 60 + programMinute;
        const currentTime = currentHour * 60 + currentMinute;
        
        // 只顯示當前時段和未來的節目
        if (programStartTime >= currentTime) {
          console.log(`時段 ${program.time}: 顯示節目 - ${program.title}`);
          fullSchedule.push(program);
        }
      });
      
      let limitedPrograms = fullSchedule;
      
      console.log('節目表數據:', today.schedule);
      console.log('可見節目:', visiblePrograms);
      console.log('限制後節目:', limitedPrograms);
      
      // 調試：顯示可見節目的時間
      console.log('可見節目時間:', visiblePrograms.map(p => `${p.time} - ${p.title}`));
      
      // 如果沒有節目，應該不會發生，因為 getDefaultSchedule 會提供「目前暫無節目」卡片
      if (limitedPrograms.length === 0) {
        console.log('警告：沒有找到任何節目，包括暫無節目卡片');
        return;
      }
      
      limitedPrograms.forEach((program, index) => {
        const status = getProgramStatus(program);
        const isCurrent = status === 'now-playing';
        const isUpcoming = status === 'upcoming';
        
        const scheduleItem = document.createElement('div');
        scheduleItem.className = `schedule-item ${isCurrent ? 'current' : ''} ${isUpcoming ? 'upcoming' : ''}`;
        
        // 創建現代電視台風格的卡片內容
        scheduleItem.innerHTML = `
          <div class="schedule-thumbnail">
            <img src="${program.thumbnail || 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=225&fit=crop'}" 
                 alt="${escapeHtml(program.title)}" 
                 onerror="this.src='https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=225&fit=crop';">
            <div class="schedule-time">${program.time}</div>
            
            ${isCurrent ? '<div class="now-playing-badge">🔴 現正播放</div>' : ''}
            ${program.isPremiere ? '<div class="premiere-badge">首播</div>' : ''}
            ${program.isSpecial ? '<div class="special-badge">特別節目</div>' : ''}
            
        ${program.youtubeId ? '<div class="play-button" title="播放">▶️</div>' : ''}
          </div>
          <div class="schedule-content">
            <div class="program-title">${escapeHtml(program.title)}</div>
            <div class="program-description">${escapeHtml(program.description)}</div>
            <div class="schedule-meta">
              <div class="program-category">${escapeHtml(program.category)}</div>
              <div class="schedule-duration">${program.duration}分鐘</div>
            </div>
          </div>
        `;
        
        // 添加點擊事件 - 只有現正播出的節目可以播放
      scheduleItem.addEventListener('click', () => {
          console.log('點擊節目:', program.title, '狀態:', status);
          
          // 只有現正播出的節目才能播放
          if (isCurrent && program.youtubeId) {
            console.log('播放現正播出節目:', program.title);
            openFullscreenPlayer(program.youtubeId);
          } else {
            console.log('此節目不可播放，僅顯示縮圖');
            // 可以添加提示訊息
            showNonPlayableMessage(program.title, status);
          }
        });

      // 紅色播放按鈕：保留功能，點擊直接播放現正播出
      const playButton = scheduleItem.querySelector('.play-button');
      if (playButton) {
        playButton.addEventListener('click', (e) => {
          e.stopPropagation();
          if (isCurrent && program.youtubeId) {
            openFullscreenPlayer(program.youtubeId);
          } else {
            showNonPlayableMessage(program.title, status);
          }
        });
      }
        
        scheduleListEl.appendChild(scheduleItem);
      });
      
      // 如果有更多節目，添加「更多」按鈕
      if (visiblePrograms.length > 24) {
        const moreButton = document.createElement('div');
        moreButton.className = 'schedule-more-button';
        moreButton.innerHTML = `
          <div class="more-content">
            <div class="more-icon">📺</div>
            <div class="more-text">
              <div class="more-title">查看更多節目</div>
              <div class="more-subtitle">還有 ${visiblePrograms.length - 24} 個節目</div>
            </div>
            <div class="more-arrow">→</div>
          </div>
        `;
        
        moreButton.addEventListener('click', () => {
          window.location.href = 'schedule.html';
        });
        
        scheduleListEl.appendChild(moreButton);
      }
      
      // 更新滾動指示器和導航
      addScrollIndicator(scheduleListEl, limitedPrograms.length);
      initScheduleNavigation(scheduleListEl, limitedPrograms.length);
    }
  }

  // 添加滾動指示器
  function addScrollIndicator(container, itemCount) {
    // 移除現有的指示器
    const existingIndicator = document.querySelector('.schedule-scroll-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // 如果節目數量少於等於4個，不需要指示器
    if (itemCount <= 4) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'schedule-scroll-indicator';
    
    // 計算需要多少個指示點
    const dotsCount = Math.ceil(itemCount / 4);
    
    for (let i = 0; i < dotsCount; i++) {
      const dot = document.createElement('div');
      dot.className = `scroll-dot ${i === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        // 滾動到對應位置
        const scrollPosition = i * 4 * 336; // 4個卡片 * 卡片寬度(320px + 16px gap)
        // 確保不會滾動到現正播出卡片（第一個卡片）
        const maxScroll = Math.max(0, scrollPosition);
        
        container.scrollTo({
          left: maxScroll,
          behavior: 'smooth'
        });
        
        // 更新活動指示點
        document.querySelectorAll('.scroll-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
      indicator.appendChild(dot);
    }
    
    // 監聽滾動事件更新指示點
    container.addEventListener('scroll', () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = 336; // 卡片寬度 + gap
      const activeIndex = Math.round(scrollLeft / cardWidth);
      
      document.querySelectorAll('.scroll-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === Math.floor(activeIndex / 4));
      });
    });
    
    container.parentNode.appendChild(indicator);
  }

  // 初始化箭頭導航
  function initScheduleNavigation(container, itemCount) {
    const leftArrow = document.getElementById('schedule-nav-left');
    const rightArrow = document.getElementById('schedule-nav-right');
    
    if (!leftArrow || !rightArrow) return;
    
    // 左箭頭始終隱藏，因為現正播出卡片不參與輪播
    leftArrow.style.display = 'none';
    
    // 如果節目數量少於等於4個，隱藏右箭頭
    if (itemCount <= 4) {
      rightArrow.style.display = 'none';
      return;
    }
    
    // 只顯示右箭頭
    rightArrow.style.display = 'flex';
    
    // 更新箭頭狀態
    function updateArrowStates() {
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      
      // 左箭頭始終隱藏，不需要狀態更新
      
      // 右箭頭：如果已經滾動到最右邊，則禁用
      if (scrollLeft >= scrollWidth - clientWidth - 1) {
        rightArrow.classList.add('disabled');
      } else {
        rightArrow.classList.remove('disabled');
      }
    }
    
    // 自動滾動功能
    let autoScrollTimer = null;
    const autoScrollDelay = 300; // 自動滾動延遲時間（毫秒）
    
    // 左箭頭已隱藏，不需要事件監聽器
    
    // 右箭頭事件
    rightArrow.addEventListener('mouseenter', () => {
      if (rightArrow.classList.contains('disabled')) return;
      
      autoScrollTimer = setInterval(() => {
        if (rightArrow.classList.contains('disabled')) {
          clearInterval(autoScrollTimer);
          return;
        }
        
        const currentScroll = container.scrollLeft;
        const cardWidth = 336; // 卡片寬度 + gap
        const scrollAmount = cardWidth * 2; // 一次滾動2個卡片
        
        // 確保不會滾動到現正播出卡片（第一個卡片）
        const maxScroll = Math.max(0, currentScroll + scrollAmount);
        
        container.scrollTo({
          left: maxScroll,
          behavior: 'smooth'
        });
      }, autoScrollDelay);
    });
    
    rightArrow.addEventListener('mouseleave', () => {
      if (autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }
    });
    
    // 保留點擊事件作為備用
    leftArrow.addEventListener('click', () => {
      if (leftArrow.classList.contains('disabled')) return;
      
      const currentScroll = container.scrollLeft;
      const cardWidth = 336;
      const scrollAmount = Math.min(cardWidth * 4, currentScroll);
      
      // 確保不會滾動到現正播出卡片（第一個卡片）
      const minScroll = Math.max(0, currentScroll - scrollAmount);
      
      container.scrollTo({
        left: minScroll,
        behavior: 'smooth'
      });
    });
    
    rightArrow.addEventListener('click', () => {
      if (rightArrow.classList.contains('disabled')) return;
      
      const currentScroll = container.scrollLeft;
      const cardWidth = 336;
      const scrollAmount = cardWidth * 4;
      
      // 確保不會滾動到現正播出卡片（第一個卡片）
      const maxScroll = Math.max(0, currentScroll + scrollAmount);
      
      container.scrollTo({
        left: maxScroll,
        behavior: 'smooth'
      });
    });
    
    // 監聽滾動事件更新箭頭狀態
    container.addEventListener('scroll', updateArrowStates);
    
    // 初始化箭頭狀態
    updateArrowStates();
  }

  // 獲取台灣時間
  function getTaiwanTime() {
    // 使用 Intl.DateTimeFormat 來獲取精確的台灣時間
    const now = new Date();
    const taiwanTime = now;
    return taiwanTime;
  }

  function getProgramStatus(program) {
    const taiwanTime = getTaiwanTime();
    const currentTime = taiwanTime.getHours() * 60 + taiwanTime.getMinutes();
    
    const [programHour, programMinute] = program.time.split(':').map(Number);
    const programStartTime = programHour * 60 + programMinute;
    const programEndTime = programStartTime + parseInt(program.duration);
    
    // 調試輸出
    console.log(`檢查節目 ${program.time} (${program.title}): 開始=${programStartTime}, 結束=${programEndTime}, 當前=${currentTime}`);
    
    // 簡化邏輯：只檢查當前時間是否在節目時間範圍內
    if (currentTime >= programStartTime && currentTime < programEndTime) {
      console.log(`  -> 現正播放`);
      return 'now-playing'; // 現正播放
    } else if (currentTime < programStartTime) {
      console.log(`  -> 即將播出`);
      return 'upcoming'; // 即將播出
    } else {
      console.log(`  -> 已結束`);
      return 'ended'; // 已結束
    }
  }

  // 獲取當前時間字符串（台灣時間）
  function getCurrentTimeString() {
    const taiwanTime = getTaiwanTime();
    const hours = taiwanTime.getHours().toString().padStart(2, '0');
    const minutes = taiwanTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // 獲取星期幾（台灣時間）
  function getDayOfWeek(date) {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return days[date.getDay()];
  }


  // 判斷是否為當前正在播出的節目（向後兼容）
  function isCurrentProgram(program) {
    return getProgramStatus(program) === 'now-playing';
  }

  // 判斷是否應該顯示節目（只顯示當前和未來節目）
  function shouldShowProgram(program) {
    const status = getProgramStatus(program);
    return status === 'now-playing' || status === 'upcoming';
  }

  // 開始時間更新
  function startTimeUpdates() {
    // 清除現有的更新間隔
    if (currentTimeUpdateInterval) {
      clearInterval(currentTimeUpdateInterval);
    }
    
    // 每分鐘更新一次時間（減少更新頻率，避免影響佈局）
    currentTimeUpdateInterval = setInterval(() => {
      const currentDateTimeEl = document.getElementById('currentDateTime');
      
      if (currentDateTimeEl) {
        const taiwanTime = getTaiwanTime();
        const month = taiwanTime.getMonth() + 1;
        const day = taiwanTime.getDate();
        const dayOfWeek = getDayOfWeek(taiwanTime);
        const timeString = getCurrentTimeString();
        
        // 顯示完整的時間信息，但使用簡潔格式
        currentDateTimeEl.innerHTML = `${month}月${day}日 ${dayOfWeek} 現在時間 ${timeString}`;
      }
      
      // 檢查日期是否改變（跨日檢查）
      const taiwanTime = getTaiwanTime();
      const currentDate = taiwanTime.toISOString().split('T')[0];
      
      if (scheduleData && scheduleData.today && scheduleData.today.date !== currentDate) {
        console.log('檢測到日期改變，重新載入節目表');
        loadScheduleData();
        return;
      }
      
      // 每分鐘檢查一次是否需要更新當前節目高亮（使用台灣時間）
      if (taiwanTime.getSeconds() === 0) {
        updateScheduleDisplay();
      }
    }, 1000);
  }

  // 添加節目表樣式
  function addScheduleStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .schedule-more-button {
        min-width: 280px;
        height: 120px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 10px;
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        border: 2px solid transparent;
      }
      
      .schedule-more-button:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .more-content {
        display: flex;
        align-items: center;
        gap: 15px;
        color: white;
        text-align: center;
      }
      
      .more-icon {
        font-size: 32px;
        opacity: 0.9;
      }
      
      .more-text {
        flex: 1;
      }
      
      .more-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .more-subtitle {
        font-size: 12px;
        opacity: 0.8;
      }
      
      .more-arrow {
        font-size: 20px;
        font-weight: bold;
        opacity: 0.8;
      }
      
      .schedule-empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        width: 100%;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 15px;
        margin: 20px 0;
      }
      
      .empty-content {
        text-align: center;
        color: #6c757d;
      }
      
      .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.6;
      }
      
      .empty-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #495057;
      }
      
      .empty-subtitle {
        font-size: 14px;
        margin-bottom: 20px;
        opacity: 0.8;
      }
      
      .empty-button {
        display: inline-block;
        background: #2b71d2;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
      }
      
      .empty-button:hover {
        background: #1e5bb8;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(43, 113, 210, 0.3);
      }
      
      .now-playing-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #ff4444;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        z-index: 10;
        animation: pulse 2s infinite;
      }
      
      
      .play-button {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 10;
      }
      
      .schedule-item:hover .play-button {
        opacity: 1;
      }
      
      .schedule-item.current {
        border: 2px solid #ff4444;
        box-shadow: 0 0 20px rgba(255, 68, 68, 0.3);
      }
      
      .schedule-item:not(.current) {
        opacity: 0.7;
        filter: grayscale(0.3);
      }
      
      .schedule-item:not(.current):hover {
        opacity: 0.8;
        transform: none;
      }
      
      .schedule-item:not(.current) .play-button {
        display: none;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // 頁面載入時初始化節目時間表
  addScheduleStyles();
  
  // 強制重新載入節目表，確保使用最新資料
  console.log('🚀 頁面載入，強制重新載入節目表');
  loadScheduleData();
  
  // 頁面載入完成
  console.log('✅ 頁面初始化完成');
  
  // 確保載入指示器已隱藏（備用檢查）
  setTimeout(() => {
    hideLoadingIndicator();
  }, 1000);
  
  // 添加調試函數到全域
  window.debugScheduleData = function() {
    console.log('=== 節目表調試資訊 ===');
    console.log('當前 scheduleData:', scheduleData);
    console.log('window.scheduleData:', window.scheduleData);
    console.log('localStorage currentSchedule:', localStorage.getItem('currentSchedule'));
    console.log('localStorage calendar_events:', localStorage.getItem('calendar_events'));
    console.log('localStorage scheduleData:', localStorage.getItem('scheduleData'));
    
    if (scheduleData && scheduleData.today && scheduleData.today.schedule) {
      console.log('節目列表:');
      scheduleData.today.schedule.forEach((program, index) => {
        console.log(`${index + 1}. ${program.time} - ${program.title} (${program.youtubeId})`);
      });
    }
  };
  
  // 添加日期調試函數
  window.debugDateSchedule = async function(date) {
    const targetDate = date || getTaiwanTime().toISOString().split('T')[0];
    console.log(`=== ${targetDate} 節目表調試 ===`);
    
    try {
      const response = await contentfulClient.getEntries({
        content_type: 'scheduleItem',
        'fields.airDate': targetDate,
        order: 'fields.airDate,fields.slotIndex',
        include: 2,
        limit: 100
      });
      
      console.log(`${targetDate} 的節目數量:`, response.items?.length || 0);
      if (response.items && response.items.length > 0) {
        response.items.forEach((item, index) => {
          const fields = item.fields || {};
          console.log(`${index + 1}. ${fields.airDate} - ${fields.title}`);
        });
      }
    } catch (error) {
      console.error('查詢日期節目表時發生錯誤:', error);
    }
  };

  // 頁面卸載時清理定時器
  window.addEventListener('beforeunload', () => {
    if (currentTimeUpdateInterval) {
      clearInterval(currentTimeUpdateInterval);
    }
  });

  // 啟動時間更新
  startTimeUpdates();
});

// === 全螢幕播放器功能 ===
let fullscreenPlayerObject = null;
let nowPlayingInlineTimer = null;
let nowPlayingInlineVideoId = null;
let nowPlayingInlinePlayerObject = null;

function cleanupNowPlayingInlinePlayer() {
  const container = document.querySelector('.now-playing-thumbnail');
  const inlinePlayer = document.getElementById('now-playing-inline-player');
  const inlineFallback = document.getElementById('now-playing-inline-fallback');
  const nowPlayingImage = document.getElementById('now-playing-image');
  if (inlinePlayer && container) {
    container.removeChild(inlinePlayer);
  }
  if (inlineFallback && container) {
    container.removeChild(inlineFallback);
  }
  if (nowPlayingImage) {
    nowPlayingImage.style.display = '';
  }
  if (nowPlayingInlinePlayerObject) {
    try {
      nowPlayingInlinePlayerObject.destroy();
    } catch (e) {}
    nowPlayingInlinePlayerObject = null;
  }
  if (nowPlayingInlineTimer) {
    clearTimeout(nowPlayingInlineTimer);
    nowPlayingInlineTimer = null;
  }
  nowPlayingInlineVideoId = null;
}

function showNowPlayingInlineFallback(message, videoId) {
  const container = document.querySelector('.now-playing-thumbnail');
  if (!container) return;
  const existing = document.getElementById('now-playing-inline-fallback');
  if (existing) {
    existing.innerHTML = '';
    container.removeChild(existing);
  }
  const fallback = document.createElement('div');
  fallback.id = 'now-playing-inline-fallback';
  fallback.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);color:#fff;z-index:2;text-align:center;padding:16px;';
  const safeMessage = message || '此影片無法在網站內播放';
  const safeId = videoId || '';
  fallback.innerHTML = `
    <div>
      <div style="font-size:1rem;font-weight:600;margin-bottom:8px;">${safeMessage}</div>
      ${safeId ? `<a href="https://www.youtube.com/watch?v=${safeId}" target="_blank" rel="noopener" style="display:inline-block;background:#e53935;color:#fff;padding:8px 12px;border-radius:6px;text-decoration:none;">改到 YouTube 播放</a>` : ''}
    </div>
  `;
  container.appendChild(fallback);
}

function renderNowPlayingInlinePlayer(videoId) {
  const container = document.querySelector('.now-playing-thumbnail');
  const nowPlayingImage = document.getElementById('now-playing-image');
  if (!container) return;

  // 清理舊的播放器
  const existing = document.getElementById('now-playing-inline-player');
  if (existing) {
    container.removeChild(existing);
  }

  if (nowPlayingImage) {
    nowPlayingImage.style.display = 'none';
  }
  const playerHost = document.createElement('div');
  playerHost.id = 'now-playing-inline-player';
  playerHost.style.width = '100%';
  playerHost.style.height = '100%';
  playerHost.style.borderRadius = '12px';
  container.insertBefore(playerHost, container.firstChild);
  nowPlayingInlineVideoId = videoId;

  loadYouTubeAPI().then(() => {
    const hasHttpOrigin = window.location && (window.location.protocol === 'http:' || window.location.protocol === 'https:');
    const originParam = hasHttpOrigin ? window.location.origin : '';
    nowPlayingInlinePlayerObject = new YT.Player('now-playing-inline-player', {
      width: '100%',
      height: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        enablejsapi: 1,
        loop: 1,
        playlist: videoId,
        origin: originParam
      },
      events: {
        onReady: function(event) {
          try {
            event.target.mute();
            event.target.playVideo();
          } catch (e) {}
        },
        onError: function(event) {
          const code = event?.data;
          if (code === 101 || code === 150) {
            showNowPlayingInlineFallback('此影片禁止外部嵌入播放', videoId);
          } else {
            showNowPlayingInlineFallback('影片播放失敗', videoId);
          }
        }
      }
    });
  }).catch((error) => {
    console.error('YouTube API 載入失敗:', error);
    showNowPlayingInlineFallback('無法載入播放器', videoId);
  });
}

function openFullscreenPlayer(videoId) {
  console.log('openFullscreenPlayer 被調用，videoId:', videoId);
  
  // 創建全螢幕播放器容器（如果不存在）
  let fullscreenPlayerEl = document.getElementById('fullscreenPlayer');
  if (!fullscreenPlayerEl) {
    console.log('創建全螢幕播放器容器...');
    fullscreenPlayerEl = document.createElement('div');
    fullscreenPlayerEl.id = 'fullscreenPlayer';
    fullscreenPlayerEl.className = 'fullscreen-player';
    fullscreenPlayerEl.innerHTML = `
      <div class="player-container">
        <button class="close-player-btn" onclick="closeFullscreenPlayer()">×</button>
        <button class="fullscreen-btn" onclick="requestFullscreen()" title="全螢幕">⛶</button>
        <div id="main-player"></div>
      </div>
    `;
    document.body.appendChild(fullscreenPlayerEl);
    console.log('全螢幕播放器容器已創建');
  } else {
    console.log('全螢幕播放器容器已存在');
  }

  // 防止頁面滾動
  document.body.style.overflow = 'hidden';
  
  // 顯示播放器
  fullscreenPlayerEl.classList.add('active');
  console.log('播放器容器已顯示');

  // 確保 DOM 元素完全創建後再創建 YouTube 播放器
  setTimeout(() => {
    // 創建 YouTube 播放器
    if (window.YT && window.YT.Player) {
      console.log('YouTube API 已載入，直接創建播放器');
      createYouTubePlayer(videoId);
    } else {
      console.log('YouTube API 未載入，開始載入...');
      // 如果 YouTube API 還沒載入，先載入
      loadYouTubeAPI().then(() => {
        console.log('YouTube API 載入成功');
        createYouTubePlayer(videoId);
      }).catch(error => {
        console.error('YouTube API 載入失敗:', error);
        showErrorMessage('無法載入影片播放器，請稍後再試');
      });
    }
  }, 100); // 延遲 100ms 確保 DOM 元素完全創建
}

function createYouTubePlayer(videoId) {
  console.log('createYouTubePlayer 被調用，videoId:', videoId);
  
  // 驗證 YouTube ID 格式
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    console.error('無效的 YouTube ID:', videoId);
    showErrorMessage('無效的影片 ID，無法播放');
    return;
  }
  
  const fullscreenPlayerEl = document.getElementById('fullscreenPlayer');
  let playerDiv = document.getElementById('main-player');
  
  if (!playerDiv) {
    console.log('播放器容器不存在，重新創建...');
    // 如果容器不存在，重新創建
    if (fullscreenPlayerEl) {
      fullscreenPlayerEl.innerHTML = `
        <div class="player-container">
          <button class="close-player-btn" onclick="closeFullscreenPlayer()">×</button>
          <div id="main-player"></div>
        </div>
      `;
      playerDiv = document.getElementById('main-player');
    }
  }
  
  if (!playerDiv) {
    console.error('仍然找不到播放器容器');
    return;
  }

  // 清空之前的播放器
  playerDiv.innerHTML = '';
  
  try {
    // 創建新的 YouTube 播放器
    fullscreenPlayerObject = new YT.Player('main-player', {
      width: '100%',
      height: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 0, // 改為不自動播放，避免權限問題
        controls: 1,
        rel: 0,
        showinfo: 0,
        modestbranding: 1,
        fs: 1,
        cc_load_policy: 0,
        iv_load_policy: 3,
        autohide: 0,
        enablejsapi: 1
      },
      events: {
        onReady: function(event) {
          console.log('YouTube 播放器準備就緒');

          // 開始播放
          console.log('開始播放影片...');
          event.target.playVideo();
          
          // 延遲設定品質和全螢幕
          setTimeout(() => {
            try {
              // 嘗試設定為最高品質
              const availableQualities = event.target.getAvailableQualityLevels();
              console.log('可用品質:', availableQualities);
              
              if (availableQualities && availableQualities.length > 0) {
                // 優先選擇高清品質
                if (availableQualities.includes('hd1080')) {
                  event.target.setPlaybackQuality('hd1080');
                  console.log('設定為 1080p');
                } else if (availableQualities.includes('hd720')) {
                  event.target.setPlaybackQuality('hd720');
                  console.log('設定為 720p');
                } else if (availableQualities.includes('large')) {
                  event.target.setPlaybackQuality('large');
                  console.log('設定為 large');
                }
              }
            } catch (error) {
              console.log('設定品質時發生錯誤:', error);
            }
            
            // 嘗試進入全螢幕
            try {
              console.log('嘗試進入全螢幕模式');
              
              // 嘗試多種全螢幕方法
              const playerElement = document.getElementById('main-player');
              if (playerElement) {
                if (playerElement.requestFullscreen) {
                  playerElement.requestFullscreen();
                } else if (playerElement.webkitRequestFullscreen) {
                  playerElement.webkitRequestFullscreen();
                } else if (playerElement.mozRequestFullScreen) {
                  playerElement.mozRequestFullScreen();
                } else if (playerElement.msRequestFullscreen) {
                  playerElement.msRequestFullscreen();
                } else {
                  console.log('瀏覽器不支援全螢幕 API');
                }
              }
              
              // 同時嘗試 YouTube 播放器的全螢幕
              if (event.target.requestFullscreen) {
                event.target.requestFullscreen();
              }
            } catch (error) {
              console.log('無法自動進入全螢幕，用戶可手動點擊全螢幕按鈕:', error);
            }
          }, 2000);
        },
        onStateChange: function(event) {
          console.log('播放器狀態改變:', event.data);
          
          // 當開始播放時，記錄當前品質
          if (event.data === YT.PlayerState.PLAYING) {
            setTimeout(() => {
              try {
                const currentQuality = event.target.getPlaybackQuality();
                console.log('當前播放品質:', currentQuality);
              } catch (error) {
                console.log('獲取播放品質時發生錯誤:', error);
              }
            }, 1000);
          }
        },
        onError: function(event) {
          console.error('YouTube 播放器錯誤:', event.data);
          showErrorMessage('影片播放失敗，請檢查影片 ID 是否正確');
        }
      }
    });
    
    console.log('YouTube 播放器創建成功');
  } catch (error) {
    console.error('創建 YouTube 播放器時發生錯誤:', error);
    showErrorMessage('播放器創建失敗: ' + error.message);
  }
}

function loadYouTubeAPI() {
  return new Promise((resolve, reject) => {
    console.log('loadYouTubeAPI 被調用');
    
    if (window.YT && window.YT.Player) {
      console.log('YouTube API 已經載入');
      resolve();
      return;
    }

    // 載入 YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // 設置全局回調函數
    window.onYouTubeIframeAPIReady = function() {
      console.log('YouTube IFrame API 載入完成');
      resolve();
    };

    // 設置超時
    setTimeout(() => {
      reject(new Error('YouTube API 載入超時'));
    }, 10000);
  });
}

function closeFullscreenPlayer() {
  const fullscreenPlayerEl = document.getElementById('fullscreenPlayer');
  if (!fullscreenPlayerEl) return;

  // 恢復頁面滾動
  document.body.style.overflow = '';

  // 隱藏播放器
  fullscreenPlayerEl.classList.remove('active');

  // 銷毀 YouTube 播放器
  if (fullscreenPlayerObject) {
    fullscreenPlayerObject.destroy();
    fullscreenPlayerObject = null;
  }
}

function showErrorMessage(message) {
  // 創建錯誤訊息顯示
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ff4444;
    color: white;
    padding: 20px;
    border-radius: 8px;
    z-index: 10000;
    font-size: 16px;
    max-width: 400px;
    text-align: center;
  `;
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);

  // 3秒後自動移除
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.parentNode.removeChild(errorDiv);
    }
  }, 3000);
}

function showNonPlayableMessage(programTitle, status) {
  // 創建不可播放提示訊息
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #2b71d2;
    color: white;
    padding: 20px 30px;
    border-radius: 12px;
    z-index: 10000;
    font-size: 16px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 8px 25px rgba(43, 113, 210, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.2);
  `;
  
  let statusText = '';
  switch(status) {
    case 'upcoming':
      statusText = '即將播出';
      break;
    case 'ended':
      statusText = '已結束';
      break;
    default:
      statusText = '非現正播出';
  }
  
  messageDiv.innerHTML = `
    <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">📺 ${escapeHtml(programTitle)}</div>
    <div style="font-size: 14px; opacity: 0.9;">此節目為 ${statusText}，僅顯示縮圖</div>
    <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">只有現正播出的節目才能播放</div>
  `;
  
  document.body.appendChild(messageDiv);

  // 2秒後自動移除
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.parentNode.removeChild(messageDiv);
    }
  }, 2000);
}

function requestFullscreen() {
  console.log('手動請求全螢幕');
  
  const playerElement = document.getElementById('main-player');
  if (playerElement) {
    try {
      if (playerElement.requestFullscreen) {
        playerElement.requestFullscreen();
      } else if (playerElement.webkitRequestFullscreen) {
        playerElement.webkitRequestFullscreen();
      } else if (playerElement.mozRequestFullScreen) {
        playerElement.mozRequestFullScreen();
      } else if (playerElement.msRequestFullscreen) {
        playerElement.msRequestFullscreen();
      } else {
        console.log('瀏覽器不支援全螢幕 API');
        showErrorMessage('您的瀏覽器不支援全螢幕功能');
      }
    } catch (error) {
      console.error('全螢幕請求失敗:', error);
      showErrorMessage('無法進入全螢幕模式');
    }
  }
}

// 添加全螢幕播放器樣式
function addFullscreenPlayerStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .fullscreen-player {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 0;
    }

    .fullscreen-player.active {
      display: flex;
    }

    .player-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      max-width: 100vw;
      max-height: 100vh;
      margin: 0;
      padding: 0;
    }

    .close-player-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-player-btn:hover {
      background: #ff6666;
    }

    .fullscreen-btn {
      position: absolute;
      top: 20px;
      right: 70px;
      background: #2b71d2;
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 18px;
      cursor: pointer;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fullscreen-btn:hover {
      background: #4a8ce8;
    }

    #main-player {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
}

// 頁面載入時添加樣式
document.addEventListener('DOMContentLoaded', () => {
  addFullscreenPlayerStyles();
});

// 添加鍵盤事件監聽
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeFullscreenPlayer();
  }
});

// 點擊背景關閉播放器
document.addEventListener('click', function(e) {
  if (e.target && e.target.classList.contains('fullscreen-player')) {
    closeFullscreenPlayer();
  }
});

// === TLC風格版型渲染函數 ===
function renderTLCStyleSchedule(programs) {
  console.log('🎯 開始渲染TLC風格版型節目表，節目數量:', programs ? programs.length : 0);
  
  // 如果沒有節目數據，生成預設節目
  if (!programs || programs.length === 0) {
    console.log('📝 沒有節目數據，生成預設節目卡片');
    programs = generateDefaultProgramCards();
    console.log('✅ 已生成預設節目，數量:', programs.length);
  }
  
  // 分離現正播出和即將播出的節目
  const nowPlayingProgram = programs.find(p => {
    try {
      return getProgramStatus(p) === 'now-playing';
    } catch (error) {
      return p.status === 'now-playing';
    }
  });
  
  const upcomingPrograms = programs.filter(p => {
    try {
      return getProgramStatus(p) === 'upcoming';
    } catch (error) {
      return p.status === 'upcoming';
    }
  });

  
  console.log('🔍 現正播出節目:', nowPlayingProgram ? nowPlayingProgram.title : '無');
  console.log('📋 即將播出節目數量:', upcomingPrograms.length);
  
  // 更新現正播出區域
  if (nowPlayingProgram && nowPlayingProgram.title && nowPlayingProgram.title.trim() !== '') {
    updateNowPlayingArea(nowPlayingProgram);
  } else {
    // 如果沒有現正播出節目或節目標題為空，顯示空檔
    const taiwanTime = getTaiwanTime();
    const currentHour = taiwanTime.getHours();
    const currentMinute = taiwanTime.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const defaultNowPlaying = {
      time: currentTimeString,
      title: "目前暫無節目",
      duration: "30",
      category: "",
      description: "此時段暫無節目安排",
      thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop",
      youtubeId: "",
      status: "now-playing",
      tags: ["文化探索", "自然風光"]
    };
    console.log('📺 更新現正播出區域（空檔）:', defaultNowPlaying.title);
    updateNowPlayingArea(defaultNowPlaying);
  }

  // 渲染即將播出節目列表
  console.log('📋 開始渲染即將播出節目列表，節目數量:', upcomingPrograms.length);
  renderUpcomingProgramsList(upcomingPrograms);
}

function updateNowPlayingArea(program) {
  console.log('🚀 updateNowPlayingArea 函數被調用，節目:', program);
  
  const nowPlayingImage = document.getElementById('now-playing-image');
  const nowPlayingTitle = document.getElementById('now-playing-title');
  const nowPlayingDescription = document.getElementById('now-playing-description');
  const nowPlayingTime = document.getElementById('now-playing-time');
  const nowPlayingStatus = document.getElementById('now-playing-status');
  const nowPlayingDuration = document.getElementById('now-playing-duration');
  const nowPlayingPlayButton = document.getElementById('now-playing-play-button');

  if (nowPlayingImage) {
    const thumb = normalizeThumbnailUrl(program.thumbnail, program.youtubeId);
    nowPlayingImage.src = thumb || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop';
    nowPlayingImage.alt = escapeHtml(program.title);
  }
  if (nowPlayingTitle) {
    nowPlayingTitle.textContent = program.title || '未命名節目';
  }
  if (nowPlayingDescription) {
    // 從說明文字中移除標籤信息
    let cleanDescription = program.description || '節目描述暫無';
    cleanDescription = cleanDescription.replace(/\[分類:[^\]]*\]/g, '');
    cleanDescription = cleanDescription.replace(/\[主題:[^\]]*\]/g, '');
    cleanDescription = cleanDescription.replace(/\[時長:[^\]]*\]/g, '');
    cleanDescription = cleanDescription.replace(/\[狀態:[^\]]*\]/g, '');
    cleanDescription = cleanDescription.replace(/\[縮圖:[^\]]*\]/g, '');
    cleanDescription = cleanDescription.replace(/\[YouTube:[^\]]*\]/g, '');
    cleanDescription = cleanDescription.trim();
    nowPlayingDescription.textContent = cleanDescription;
  }
  if (nowPlayingTime) {
    // 如果是預設節目，使用當前時間
    if (!program.time || program.time === '00:00') {
      const taiwanTime = getTaiwanTime();
      const currentHour = taiwanTime.getHours();
      const currentMinute = taiwanTime.getMinutes();
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      nowPlayingTime.textContent = currentTimeString;
    } else {
      nowPlayingTime.textContent = program.time;
    }
  }
  if (nowPlayingStatus) {
    nowPlayingStatus.textContent = '現正播出';
    console.log('📺 現正播出節目狀態顯示:', nowPlayingStatus.textContent);
  }
  if (nowPlayingDuration) {
    nowPlayingDuration.textContent = (program.duration || '30') + '分鐘';
  }
  
  // 更新標題旁的標籤
  const nowPlayingTitleTags = document.getElementById('now-playing-title-tags');
  if (nowPlayingTitleTags) {
    let titleTags = [];
    
    // 添加節目分類標籤
    if (program.category && program.category.trim() !== '') {
      titleTags.push(`<span class="topic-tag">${escapeHtml(program.category)}</span>`);
    }
    
    // 添加主題探索標籤
    if (program.tags && program.tags.length > 0) {
      const topicTags = program.tags.map(topic => 
        `<span class="topic-tag">${escapeHtml(topic)}</span>`
      );
      titleTags = titleTags.concat(topicTags);
    }
    
    // 時長標籤已移除
    
    nowPlayingTitleTags.innerHTML = titleTags.join('');
    console.log('✅ 標題旁標籤已更新:', titleTags);
  }
  
  // 清空底部的標籤顯示區域（標籤已移到標題旁邊）
  const nowPlayingTopics = document.getElementById('now-playing-topics');
  if (nowPlayingTopics) {
    nowPlayingTopics.innerHTML = '';
    nowPlayingTopics.style.display = 'none';
    console.log('✅ 底部標籤區域已清空');
  }

  // 播放按鈕事件
  if (nowPlayingPlayButton) {
    nowPlayingPlayButton.onclick = (e) => {
      if (e && typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
      if (program.youtubeId) {
        openFullscreenPlayer(program.youtubeId);
      } else {
        showNonPlayableMessage(program.title, 'now-playing');
      }
    };
  }

  // 現正播出卡片點擊：直接播放該節目
  const nowPlayingCard = document.getElementById('now-playing-card');
  if (nowPlayingCard) {
    nowPlayingCard.onclick = () => {
      if (program.youtubeId) {
        openFullscreenPlayer(program.youtubeId);
      } else {
        showNonPlayableMessage(program.title, 'now-playing');
      }
    };
  }

  // 現正播出卡片自動播放：直接在卡片內輪播該影片，直到時間槽結束
  cleanupNowPlayingInlinePlayer();
  if (program.youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(program.youtubeId)) {
    renderNowPlayingInlinePlayer(program.youtubeId);

    // 計算距離時間槽結束的時間（分鐘）
    const taiwanTime = getTaiwanTime();
    const currentMinutes = taiwanTime.getHours() * 60 + taiwanTime.getMinutes();
    let endMinutes = currentMinutes + 30;
    if (program.time && /^\d{2}:\d{2}$/.test(program.time)) {
      const parts = program.time.split(':').map(Number);
      const startMinutes = parts[0] * 60 + parts[1];
      const durationMinutes = parseInt(program.duration || '30', 10) || 30;
      endMinutes = startMinutes + durationMinutes;
    }
    let diffMinutes = endMinutes - currentMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    const diffMs = Math.min(diffMinutes * 60 * 1000, 24 * 60 * 60 * 1000);

    nowPlayingInlineTimer = setTimeout(() => {
      // 時間槽結束後自動切到下一檔節目
      try {
        if (typeof updateScheduleDisplay === 'function') {
          updateScheduleDisplay();
        } else {
          cleanupNowPlayingInlinePlayer();
        }
      } catch (e) {
        cleanupNowPlayingInlinePlayer();
      }
    }, diffMs);
  }
  
  // 標籤顯示完成
  console.log('✅ 現正播出區域更新完成');
}

function renderUpcomingProgramsList(programs) {
  console.log('🔧 renderUpcomingProgramsList 被調用，節目數量:', programs ? programs.length : 0);
  
  const upcomingProgramsList = document.getElementById('upcoming-programs-list');
  console.log('🎯 找到即將播出節目列表容器:', upcomingProgramsList ? '是' : '否');
  
  if (!upcomingProgramsList) {
    console.error('❌ 找不到 upcoming-programs-list 元素！');
    return;
  }

  // 固定 24 個時段，分頁顯示（每頁 4 個）
  const filledPrograms = buildUpcomingSlots(
    programs || [],
    1,
    window.scheduleData?.tomorrow?.schedule || []
  );
  const upcomingOnly = filledPrograms.filter(program => {
    try {
      return getProgramStatus(program) === 'upcoming';
    } catch (error) {
      return program.status === 'upcoming';
    }
  });
  window._upcomingSlots = upcomingOnly;
  window._upcomingPageSize = 4;
  if (typeof window._upcomingPage !== 'number') window._upcomingPage = 0;

  // 確保右上角有左右箭頭
  const header = document.querySelector('.upcoming-programs-header');
  if (header && !document.getElementById('upcoming-nav')) {
    const nav = document.createElement('div');
    nav.id = 'upcoming-nav';
    nav.style.cssText = 'display:flex;gap:8px;align-items:center;';
    nav.innerHTML = `
      <button id="upcoming-prev" type="button" style="border:none;background:#e9ecef;color:#333;border-radius:6px;padding:4px 8px;cursor:pointer;">▲</button>
      <button id="upcoming-next" type="button" style="border:none;background:#e9ecef;color:#333;border-radius:6px;padding:4px 8px;cursor:pointer;">▼</button>
    `;
    header.appendChild(nav);
  }

  function renderUpcomingPage() {
    upcomingProgramsList.classList.add('is-switching');
    const total = window._upcomingSlots.length;
    const pageSize = window._upcomingPageSize;
    const totalPages = Math.ceil(total / pageSize);
    if (window._upcomingPage >= totalPages) window._upcomingPage = totalPages - 1;
    if (window._upcomingPage < 0) window._upcomingPage = 0;

    const start = window._upcomingPage * pageSize;
    const pageItems = window._upcomingSlots.slice(start, start + pageSize);

    upcomingProgramsList.innerHTML = '';
    pageItems.forEach((program, index) => {
      console.log(`📋 渲染即將播出節目(頁面) ${index + 1}:`, program.title, program.time);
      renderUpcomingProgramItem(program, upcomingProgramsList);
    });

    const upcomingCountEl = document.getElementById('upcoming-count');
    if (upcomingCountEl) {
      upcomingCountEl.textContent = `顯示 ${pageItems.length} / ${total} 個節目`;
    }

    if (prevBtn && nextBtn) {
      prevBtn.disabled = window._upcomingPage <= 0;
      nextBtn.disabled = window._upcomingPage >= totalPages - 1;
      prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
      nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
      prevBtn.style.cursor = prevBtn.disabled ? 'not-allowed' : 'pointer';
      nextBtn.style.cursor = nextBtn.disabled ? 'not-allowed' : 'pointer';
    }

    requestAnimationFrame(() => {
      upcomingProgramsList.classList.remove('is-switching');
    });
  }

  const prevBtn = document.getElementById('upcoming-prev');
  const nextBtn = document.getElementById('upcoming-next');
  if (prevBtn && nextBtn) {
    prevBtn.onclick = () => { window._upcomingPage -= 1; renderUpcomingPage(); };
    nextBtn.onclick = () => { window._upcomingPage += 1; renderUpcomingPage(); };
  }

  renderUpcomingPage();
}

function renderUpcomingProgramItem(program, upcomingProgramsList) {
  console.log('🎨 渲染即將播出節目列表項目:', program.title, program.time);
  
  const listItem = document.createElement('div');
  listItem.className = 'upcoming-program-item';
  
  // 檢查是否為下一個即將播出的節目
  try {
    const status = getProgramStatus(program);
    if (status === 'upcoming') {
      // 檢查是否為下一個節目（時間最接近的即將播出節目）
      const taiwanTime = getTaiwanTime();
      const currentTime = taiwanTime.getHours() * 60 + taiwanTime.getMinutes();
      const [programHour, programMinute] = program.time.split(':').map(Number);
      const programStartTime = programHour * 60 + programMinute;
      
      // 如果這個節目是下一個即將播出的節目，添加特殊樣式
      if (programStartTime > currentTime) {
        listItem.classList.add('next');
      }
    }
  } catch (error) {
    console.log('⚠️ getProgramStatus 函數未定義');
  }
  
  const upcomingThumb = normalizeThumbnailUrl(program.thumbnail, program.youtubeId);
  listItem.innerHTML = `
    <div class="upcoming-program-thumbnail">
      <img src="${upcomingThumb || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop'}" 
           style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;"
           alt="${escapeHtml(program.title || '未命名節目')}"
           onerror="this.src='https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop';">
      <div class="upcoming-program-time-overlay">${program.time || '00:00'}</div>
    </div>
    <div class="upcoming-program-info">
      <div class="upcoming-program-title">${escapeHtml(program.title || '未命名節目')}</div>
      <div class="upcoming-program-description">${escapeHtml(program.description || '節目描述暫無')}</div>
      <div class="upcoming-program-meta">
        <span class="upcoming-program-duration">${program.duration || '30'}分鐘</span>
        ${program.category && program.category.trim() !== '' ? `<span class="upcoming-program-category">${escapeHtml(program.category)}</span>` : ''}
      </div>
      ${program.tags && program.tags.length > 0 ? `
        <div class="upcoming-program-topics">
          ${program.tags.map(topic => `<span class="topic-tag">${escapeHtml(topic)}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `;

  // 點擊事件 - 即將播出的節目不能播放，只能預覽
  listItem.addEventListener('click', () => {
    console.log('🖱️ 點擊即將播出節目:', program.title);
    showNonPlayableMessage(program.title, 'upcoming');
  });

  upcomingProgramsList.appendChild(listItem);
  console.log('✅ 即將播出節目列表項目已添加到DOM:', program.title);
}

function generateDefaultUpcomingPrograms() {
  const taiwanTime = getTaiwanTime();
  const currentHour = taiwanTime.getHours();
  const currentMinute = taiwanTime.getMinutes();
  
  // 計算當前時段（每30分鐘一個時段）
  const currentTimeSlot = currentMinute < 30 ? 0 : 1;
  const startHour = currentHour;
  const startMinute = currentTimeSlot * 30;
  
  console.log('🕐 當前時間:', currentHour + ':' + currentMinute.toString().padStart(2, '0'));
  console.log('📅 當前時段:', startHour + ':' + startMinute.toString().padStart(2, '0'));
  
  const programs = [];
  
  // 生成24個即將播出的節目（未來12小時，每30分鐘一個時段）
  for (let i = 1; i <= 24; i++) { // 從1開始，跳過當前時段
    const totalMinutes = startMinute + i * 30;
    const hour = (startHour + Math.floor(totalMinutes / 60)) % 24;
    const minute = totalMinutes % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    console.log('📺 生成即將播出節目:', timeString);
    
    programs.push({
      time: timeString,
      title: "",
      duration: "30",
      category: "",
      description: "",
      thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
      youtubeId: "",
      status: "upcoming",
      tags: ["文化探索", "自然風光"]
    });
  }
  
  return programs;
}

function generateDefaultProgramCards() {
  const taiwanTime = getTaiwanTime();
  const currentHour = taiwanTime.getHours();
  const currentMinute = taiwanTime.getMinutes();
  
  // 計算當前時段（每30分鐘一個時段）
  const currentTimeSlot = currentMinute < 30 ? 0 : 1;
  const startHour = currentHour;
  const startMinute = currentTimeSlot * 30;
  
  console.log('🕐 當前時間:', currentHour + ':' + currentMinute.toString().padStart(2, '0'));
  console.log('📅 當前時段:', startHour + ':' + startMinute.toString().padStart(2, '0'));
  
  const programs = [];
  
  // 生成24個小時的節目（24個時段，每小時2個），從當前時段開始
  for (let i = 0; i < 24; i++) { // 顯示24個時段
    const totalMinutes = startMinute + i * 30;
    const hour = (startHour + Math.floor(totalMinutes / 60)) % 24;
    const minute = totalMinutes % 60;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // 第一個節目設為「現正播出」，其他節目設為「即將播出」
    let status = "upcoming";
    if (i === 0) {
      status = "now-playing";
    }
    
    console.log('📺 生成節目:', timeString, '狀態:', status);
    
    programs.push({
      time: timeString,
      title: "",
      duration: "30",
      category: "",
      description: "",
      thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
      youtubeId: "",
      status: status,
      tags: []
    });
  }
  
  return programs;
}

