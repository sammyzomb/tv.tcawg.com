// 避免文字有 HTML 特殊符號出錯
function escapeHtml(s='') {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// 初始化 Contentful client
const contentfulClient = contentful.createClient({
  space: 'os5wf90ljenp',
  accessToken: window.CONTENTFUL_CONFIG?.DELIVERY_TOKEN || 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0'
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
  if (savedTheme) body.classList.add(savedTheme);
  else {
    const h = new Date().getHours();
    if (h >= 18 || h < 6) {
      body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark-theme');
    }
  }
  updateThemeIcon(body.classList.contains('dark-theme') ? 'dark-theme' : '');
  themeSwitcher?.addEventListener('click', e => {
    e.preventDefault();
    body.classList.toggle('dark-theme');
    const cur = body.classList.contains('dark-theme') ? 'dark-theme' : '';
    localStorage.setItem('theme', cur);
    updateThemeIcon(cur);
  });
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
        const tags  = Array.isArray(f.tags) ? f.tags : [];

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

      // 建立「所有節目 / 查看更多」連結（導到所有節目頁）
      const moreWrap = document.createElement('div');
      moreWrap.id = 'featured-actions';
      moreWrap.style = 'text-align:center;margin-top:16px;';

      const moreLink = document.createElement('a');
      moreLink.id = 'featured-more';
      moreLink.href = 'videos.html'; // 重點：直接連到所有節目頁
      moreLink.className = 'video-more-btn';
      moreLink.textContent = '所有節目'; // 如果你要顯示「查看更多」，把文字改回去即可
      moreLink.style = 'padding:10px 16px;border-radius:10px;border:0;background:#0a5bfd;color:#fff;font-weight:700;cursor:pointer;box-shadow:0 4px 10px rgba(0,0,0,.08);display:inline-block;text-decoration:none;';
      moreWrap.appendChild(moreLink);
      container.after(moreWrap);

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

        // 顯示 / 隱藏「所有節目」連結：只要有資料就顯示
        moreWrap.style.display = allItems.length ? '' : 'none';
      }

      // 首次渲染
      container.innerHTML = '';
      if (allItems.length === 0) {
        container.innerHTML = `<p style="color:#999;">目前無法載入精選節目。</p>`;
        moreWrap.style.display = 'none';
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
      .spot-card{position:relative;display:block;border-radius:20px;overflow:hidden;border:1px solid rgba(0,0,0,.06);
                 box-shadow:0 10px 24px rgba(0,0,0,.06);transform:translateY(6px);opacity:0;animation:upfade .32s ease forwards}
      @media(prefers-color-scheme:dark){.spot-card{border-color:rgba(255,255,255,.12);box-shadow:0 14px 32px rgba(0,0,0,.25)}}
      .spot-card:hover{transform:translateY(0) scale(1.01)}
      .spot-img{width:100%;aspect-ratio:16/9;height:auto;object-fit:cover;display:block;filter:brightness(.94)}
      .spot-grad{position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,0) 38%, rgba(0,0,0,.55) 100%)}
      .spot-meta{position:absolute;left:16px;right:16px;bottom:14px;color:#fff;overflow:hidden;text-shadow:0 1px 4px rgba(0,0,0,.35)}
      .spot-title{font-weight:800;font-size:18px;line-height:1.28;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .spot-desc{opacity:.95;font-size:13px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      @media(max-width:640px){.spot-desc{display:none}}
      .spot-chip{position:absolute;padding:6px 10px;border-radius:999px;font-weight:900;font-size:12px;color:#fff;
                 backdrop-filter:saturate(140%) blur(4px);border:1px solid rgba(255,255,255,.22)}
      .spot-time{left:12px;bottom:12px;background:rgba(8,8,8,.45)}
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
      const currentHour = taiwanTime.getHours();
      
      console.log('正在載入節目表，月份:', currentMonth, '日期:', today, '當前時間:', currentHour + ':' + taiwanTime.getMinutes());
      
      // 檢查是否需要重新載入（日期改變）
      if (scheduleData && scheduleData.today && scheduleData.today.date === today) {
        console.log('節目表日期未改變，無需重新載入');
        return;
      }
      
      // 優先檢查管理後台添加的節目
      const calendarEvents = localStorage.getItem('calendar_events');
      if (calendarEvents) {
        try {
          const eventsData = JSON.parse(calendarEvents);
          const todayEvents = eventsData[today] || [];
          
          if (todayEvents.length > 0) {
            console.log('從 calendar_events 載入節目，共', todayEvents.length, '個節目');
            console.log('calendar_events 節目資料:', todayEvents.map(e => ({title: e.title, thumbnail: e.thumbnail, youtubeId: e.youtubeId})));
            
            // 檢查是否有錯誤的 YouTube ID（所有節目都使用同一個 ID）
            const youtubeIds = todayEvents.map(event => event.youtubeId).filter(id => id);
            const uniqueYoutubeIds = [...new Set(youtubeIds)];
            if (uniqueYoutubeIds.length === 1 && youtubeIds.length > 1) {
              console.log('⚠️ 檢測到 localStorage 中的節目都使用相同的 YouTube ID，清除 localStorage 並從 Contentful 重新載入');
              localStorage.removeItem('calendar_events');
              // 跳過 localStorage 處理，繼續執行後面的 Contentful 載入邏輯
            } else {
            // 將 localStorage 中的節目轉換為節目表格式
            const schedulePrograms = todayEvents.map(event => {
              let timeString;
              
              // 優先使用 time 欄位
              if (event.time) {
                timeString = event.time;
              } else {
                // 從備註中提取具體時間，格式為 [時間:XX:XX]
                const notes = event.notes || '';
                const timeMatch = notes.match(/\[時間:(\d{2}:\d{2})\]/);
                
                if (timeMatch) {
                  // 使用備註中的具體時間
                  timeString = timeMatch[1];
                } else {
                  // 如果沒有具體時間，使用時段轉換
                  const block = event.block || '12-18';
                  switch (block) {
                    case '00-06': timeString = '02:00'; break;
                    case '06-12': timeString = '11:30'; break;
                    case '12-18': timeString = '14:00'; break;
                    case '18-24': timeString = '22:00'; break;
                    default: timeString = '14:00';
                  }
                }
              }
              
              // 調試 localStorage 節目縮圖
              console.log('處理 localStorage 節目縮圖:', event.title, {
                hasThumbnail: !!(event.thumbnail),
                hasYoutubeId: !!(event.youtubeId),
                thumbnail: event.thumbnail,
                youtubeId: event.youtubeId
              });
              
              // 處理縮圖：優先使用 event.thumbnail，如果有 youtubeId 則生成 YouTube 縮圖
              let thumbnail = event.thumbnail;
              if (!thumbnail && event.youtubeId) {
                thumbnail = `https://i.ytimg.com/vi/${event.youtubeId}/hqdefault.jpg`;
                console.log('生成 YouTube 縮圖:', thumbnail);
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
            }).sort((a, b) => {
              // 按時間排序
              return a.time.localeCompare(b.time);
            });
            
            scheduleData = {
              today: {
                date: today,
                dayOfWeek: getDayOfWeek(taiwanTime),
                month: `${taiwanTime.getMonth() + 1}月`,
                day: `${taiwanTime.getDate()}日`,
                schedule: schedulePrograms
              }
            };
            
            console.log('使用管理後台添加的節目表，共', scheduleData.today.schedule.length, '個節目');
            updateScheduleDisplay();
            startTimeUpdates();
            return;
            }
          }
        } catch (e) {
          console.log('管理後台節目表解析失敗:', e);
        }
      }
      
      // 嘗試從 Contentful 載入月度節目表
      try {
        const response = await contentfulClient.getEntries({
          content_type: 'scheduleItem',
          'fields.airDate[gte]': today,
          'fields.airDate[lt]': new Date(taiwanTime.getFullYear(), taiwanTime.getMonth() + 1, 1).toISOString().split('T')[0],
          order: 'fields.airDate,fields.slotIndex',
          include: 2
        });
        
        console.log('Contentful 回應:', response.items?.length || 0, '個項目');
        
        if (response.items && response.items.length > 0) {
          // 過濾今天的節目，並排除推薦節目
          const todayPrograms = response.items.filter(item => {
            const fields = item.fields || {};
            const title = fields.title || '';
            
            // 排除推薦節目（包含特定關鍵字的節目）
            const isRecommendedProgram = title.includes('加拿大的寒冰生活') || 
                                       title.includes('加拿大捕魚') || 
                                       title.includes('加拿大的極光晚餐') ||
                                       title.includes('2025-08-19'); // 舊日期
            
            return fields.airDate === today && !isRecommendedProgram;
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
            // 3. 使用 YouTube 縮圖
            else if (video.youtubeId || video.youTubeId) {
              const youtubeId = video.youtubeId || video.youTubeId;
              thumbnail = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
            }
            // 4. 預設縮圖
            else {
              thumbnail = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop';
            }
            
            // 調試縮圖處理
            console.log('處理節目縮圖 (v2.5):', item.fields.title, {
              hasItemThumbnailUrl: !!(item.fields.thumbnailUrl),
              hasVideoThumbnail: !!(video.thumbnail?.fields?.file?.url),
              hasYoutubeId: !!(video.youtubeId || video.youTubeId),
              finalThumbnail: thumbnail
            });
            
            return {
              time: timeString,
              title: item.fields.title || '未命名節目',
              duration: '30', // 預設30分鐘
              category: video.category || '旅遊',
              description: video.description || '',
              thumbnail: thumbnail,
              youtubeId: video.youtubeId || video.youTubeId || '',
              status: item.fields.isPremiere ? '首播' : '重播',
              tags: []
            };
          }).sort((a, b) => {
            // 按時間排序
            return a.time.localeCompare(b.time);
          });
          
          scheduleData = {
            today: {
              date: today,
              dayOfWeek: getDayOfWeek(taiwanTime),
              month: `${taiwanTime.getMonth() + 1}月`,
              day: `${taiwanTime.getDate()}日`,
              schedule: todayPrograms
            }
          };
          
          console.log('成功從 Contentful 載入節目表，共', scheduleData.today.schedule.length, '個節目');
        } else {
          // 如果沒有找到節目，使用預設數據
          scheduleData = {
            today: {
              date: today,
              dayOfWeek: getDayOfWeek(taiwanTime),
              month: `${taiwanTime.getMonth() + 1}月`,
              day: `${taiwanTime.getDate()}日`,
              schedule: getDefaultSchedule(today)
            }
          };
          console.log('Contentful 中沒有找到節目，使用預設節目表');
        }
      } catch (contentfulError) {
        console.log('Contentful 載入失敗，使用預設節目表:', contentfulError.message);
        // 使用預設數據
        scheduleData = {
          today: {
            date: today,
            dayOfWeek: getDayOfWeek(taiwanTime),
            month: `${taiwanTime.getMonth() + 1}月`,
            day: `${taiwanTime.getDate()}日`,
            schedule: getDefaultSchedule(today)
          }
        };
      }
      
      updateScheduleDisplay();
      startTimeUpdates();
      
    } catch (error) {
      console.error('載入節目表失敗:', error);
      
      // 如果載入失敗，使用預設數據（台灣時間）
      const taiwanTime = getTaiwanTime();
      scheduleData = {
        today: {
          date: taiwanTime.toISOString().split('T')[0],
          dayOfWeek: getDayOfWeek(taiwanTime),
          month: `${taiwanTime.getMonth() + 1}月`,
          day: `${taiwanTime.getDate()}日`,
          schedule: getDefaultSchedule(taiwanTime.toISOString().split('T')[0])
        }
      };
      updateScheduleDisplay();
      startTimeUpdates();
    }
  }

  // 預設節目表（當沒有真實節目時使用）
  function getDefaultSchedule(date) {
    console.log('沒有找到真實節目資料，顯示暫無節目卡片');
    
    const currentHour = new Date().getHours();
    const startHour = Math.max(12, currentHour - 1); // 從當前時間前1小時開始，最少從12點開始
    
    const programs = [];
    
    // 生成12個小時的節目（24個時段，每小時2個）
    for (let i = 0; i < 24; i++) {
      const hour = (startHour + Math.floor(i / 2)) % 24; // 處理跨日情況
      const minute = (i % 2) * 30; // 0或30分鐘
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
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
    
    return programs;
  }

  // 更新節目時間表顯示
  function updateScheduleDisplay() {
    if (!scheduleData) return;

    const { today } = scheduleData;
    
    // 更新日期顯示（使用台灣時間）
    const monthDayEl = document.getElementById('currentMonthDay');
    const dayOfWeekEl = document.getElementById('currentDayOfWeek');
    const currentTimeEl = document.getElementById('currentTime');
    const scheduleListEl = document.getElementById('schedule-list');

    // 獲取台灣時間的日期信息
    const taiwanTime = getTaiwanTime();
    const currentMonth = taiwanTime.getUTCMonth() + 1;
    const currentDay = taiwanTime.getUTCDate();
    const currentDayOfWeek = getDayOfWeek(taiwanTime);

    if (monthDayEl) monthDayEl.textContent = `${currentMonth}月${currentDay}日`;
    if (dayOfWeekEl) dayOfWeekEl.textContent = currentDayOfWeek;
    if (currentTimeEl) currentTimeEl.textContent = getCurrentTimeString();

    // 更新節目列表（現代電視台設計）
    if (scheduleListEl && today.schedule) {
      scheduleListEl.innerHTML = '';
      
      // 過濾節目：顯示當前和未來節目，以及跨日時段的節目
      const visiblePrograms = today.schedule.filter(shouldShowProgram);
      
      // 如果可見節目少於24個，補充「暫無節目」卡片以確保顯示完整的12個小時
      let limitedPrograms = visiblePrograms.slice(0, 24);
      
      if (limitedPrograms.length < 24) {
        // 生成完整的12個小時節目表（24個時段）
        // 從當前時間開始顯示，確保第一個卡片是當前時段
        const taiwanTime = getTaiwanTime();
        const currentHour = taiwanTime.getHours();
        const currentMinute = taiwanTime.getMinutes();
        
        // 計算當前時段（每30分鐘一個時段）
        const currentTimeSlot = currentMinute < 30 ? 0 : 1;
        const startHour = currentHour;
        
        const fullSchedule = [];
        for (let i = 0; i < 24; i++) {
          const hour = (startHour + Math.floor(i / 2)) % 24;
          const minute = ((currentTimeSlot + i) % 2) * 30;
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          
          // 檢查是否已有該時段的節目
          const existingProgram = visiblePrograms.find(p => p.time === timeString);
          
          if (existingProgram) {
            fullSchedule.push(existingProgram);
          } else {
            // 添加「暫無節目」卡片
            fullSchedule.push({
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
        }
        
        limitedPrograms = fullSchedule;
      }
      
      console.log('節目表數據:', today.schedule);
      console.log('可見節目:', visiblePrograms);
      console.log('限制後節目:', limitedPrograms);
      
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
            
            ${program.youtubeId ? '<div class="play-button">▶️</div>' : ''}
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
        
        // 添加點擊事件
        scheduleItem.addEventListener('click', () => {
          console.log('播放節目:', program.title);
          
          if (program.youtubeId) {
            openFullscreenPlayer(program.youtubeId);
          }
        });
        
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
        container.scrollTo({
          left: scrollPosition,
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
    
    // 如果節目數量少於等於4個，隱藏箭頭
    if (itemCount <= 4) {
      leftArrow.style.display = 'none';
      rightArrow.style.display = 'none';
      return;
    }
    
    // 顯示箭頭
    leftArrow.style.display = 'flex';
    rightArrow.style.display = 'flex';
    
    // 更新箭頭狀態
    function updateArrowStates() {
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      
      // 左箭頭：如果已經滾動到最左邊，則禁用
      if (scrollLeft <= 0) {
        leftArrow.classList.add('disabled');
      } else {
        leftArrow.classList.remove('disabled');
      }
      
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
    
    // 左箭頭事件
    leftArrow.addEventListener('mouseenter', () => {
      if (leftArrow.classList.contains('disabled')) return;
      
      autoScrollTimer = setInterval(() => {
        if (leftArrow.classList.contains('disabled')) {
          clearInterval(autoScrollTimer);
          return;
        }
        
        const currentScroll = container.scrollLeft;
        const cardWidth = 336; // 卡片寬度 + gap
        const scrollAmount = Math.min(cardWidth * 2, currentScroll); // 一次滾動2個卡片或剩餘距離
        
        container.scrollTo({
          left: currentScroll - scrollAmount,
          behavior: 'smooth'
        });
      }, autoScrollDelay);
    });
    
    leftArrow.addEventListener('mouseleave', () => {
      if (autoScrollTimer) {
        clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }
    });
    
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
        
        container.scrollTo({
          left: currentScroll + scrollAmount,
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
      
      container.scrollTo({
        left: currentScroll - scrollAmount,
        behavior: 'smooth'
      });
    });
    
    rightArrow.addEventListener('click', () => {
      if (rightArrow.classList.contains('disabled')) return;
      
      const currentScroll = container.scrollLeft;
      const cardWidth = 336;
      const scrollAmount = cardWidth * 4;
      
      container.scrollTo({
        left: currentScroll + scrollAmount,
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
    const taiwanTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Taipei"}));
    return taiwanTime;
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

  // 判斷節目狀態（使用台灣時間）
  function getProgramStatus(program) {
    const taiwanTime = getTaiwanTime();
    const currentTime = taiwanTime.getHours() * 60 + taiwanTime.getMinutes();
    
    const [programHour, programMinute] = program.time.split(':').map(Number);
    const programStartTime = programHour * 60 + programMinute;
    const programEndTime = programStartTime + parseInt(program.duration);
    
    // 處理跨日情況：如果節目時間小於當前時間，可能是隔天的節目
    let adjustedProgramStartTime = programStartTime;
    if (programStartTime < currentTime && programStartTime < 12 * 60) { // 如果節目時間是凌晨時段且小於當前時間
      adjustedProgramStartTime += 24 * 60; // 加24小時，視為隔天節目
    }
    
    if (currentTime >= programStartTime && currentTime < programEndTime) {
      return 'now-playing'; // 現正播放
    } else if (currentTime < adjustedProgramStartTime) {
      return 'upcoming'; // 即將播出（包括隔天節目）
    } else {
      return 'ended'; // 已結束
    }
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
    
    // 每秒更新一次時間
    currentTimeUpdateInterval = setInterval(() => {
      const currentDateTimeEl = document.getElementById('currentDateTime');
      
      if (currentDateTimeEl) {
        const taiwanTime = getTaiwanTime();
        const month = taiwanTime.getMonth() + 1;
        const day = taiwanTime.getDate();
        const dayOfWeek = getDayOfWeek(taiwanTime);
        const timeString = getCurrentTimeString();
        
        currentDateTimeEl.innerHTML = `台灣時間 <span class="flip-clock date">${month}月${day}日</span> <span class="flip-clock day">${dayOfWeek}</span> 現在時間 <span class="flip-clock time">${timeString}</span>`;
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
  loadScheduleData();

  // 頁面卸載時清理定時器
  window.addEventListener('beforeunload', () => {
    if (currentTimeUpdateInterval) {
      clearInterval(currentTimeUpdateInterval);
    }
  });
});

