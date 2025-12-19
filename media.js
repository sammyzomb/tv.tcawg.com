// media.js：HERO 播放 + 全螢幕播放器
(function(){
  let heroVideos = [], currentHeroIndex = 0, heroPlayer;
  let ytIdToIndex = {};
  let heroTimer = null;
  let heroOrder = [];     // 洗牌後的 id 順序
  let heroPos = 0;        // 目前指向
  let lastPlayedId = null;

  // 只使用 Contentful 資料，不提供備用資料

  // 初始化 Contentful client
  const contentfulClient = contentful.createClient({
    space: 'os5wf90ljenp',
    accessToken: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0'
  });

  document.addEventListener('DOMContentLoaded', () => {
    // 抓 Hero 影片
    // 先獲取所有影片，然後過濾 HERO 影片
    contentfulClient.getEntries({
      content_type: 'video',
      order: '-sys.updatedAt',
      limit: 50  // 減少載入數量，提升載入速度
    }).then(response => {
      const mapped = response.items
        .filter(item => {
          // 只保留 HERO 影片
          const isHero = item.fields.isHero || item.fields.首頁HERO || false;
          return isHero === true;
        })
        .map(item => ({
          sysId: item.sys.id,
          updatedAt: item.sys.updatedAt,
          id: item.fields.youTubeId || item.fields.youtubeId || item.fields.YouTubeID || '',
          title: item.fields.heroTitle || item.fields.title || '',
          desc: item.fields.heroText || item.fields.description || '',
          thumb: item.fields.thumbnail?.fields?.file?.url || ''
        })).filter(v => v.id);

      // 去重（同一 YouTube ID 保留較新）
      const byId = new Map();
      for (const v of mapped) {
        const ex = byId.get(v.id);
        if (!ex || new Date(v.updatedAt) > new Date(ex.updatedAt)) byId.set(v.id, v);
      }
      let data = Array.from(byId.values());

      console.log(`從 Contentful 獲取到 ${response.items.length} 個影片`);
      console.log(`過濾後找到 ${data.length} 個 HERO 影片`);
      
      // 只使用 Contentful 資料
      if (!data.length) {
        console.error('❌ Contentful 中沒有 Hero 影片');
        console.log('請在 Contentful 中設定 HERO 影片 (isHero: true)');
        console.log('或者檢查影片的 isHero 欄位是否設為 true');
        
        // 顯示錯誤訊息給用戶
        const heroCaption = document.getElementById('heroCaption');
        if (heroCaption) {
          heroCaption.innerHTML = `
            <div class="cap-title">影片播放器設定錯誤</div>
            <div class="cap-desc">請在 Contentful 中設定 HERO 影片</div>
          `;
          heroCaption.classList.add('visible');
        }
        
        return; // 直接返回，不初始化播放器
      } else {
        console.log(`✅ 成功從 Contentful 載入 ${data.length} 個 HERO 影片`);
        console.log('📹 HERO 影片列表:', data.map(v => ({ id: v.id, title: v.title })));
        if (data.length === 1) {
          console.warn('⚠️ 只有 1 個 HERO 影片，輪播效果不明顯');
        }
      }

      // 洗牌
      let i = data.length, r;
      while (i !== 0) {
        r = Math.floor(Math.random() * i);
        i--;
        [data[i], data[r]] = [data[r], data[i]];
      }

      heroVideos = data;
      heroOrder = heroVideos.map(v => v.id);
      heroPos = 0;
      ytIdToIndex = {};
      heroVideos.forEach((v, idx) => ytIdToIndex[v.id] = idx);

      if (!heroOrder.length) {
        console.log('沒有找到 Hero 影片，不初始化播放器');
        return;
      }
      initializeHeroPlayer();
    }).catch(err => {
      console.error('❌ Contentful 載入失敗:', err);
      console.log('請檢查 Contentful 連線設定或網路連線');
      console.log('HERO 影片系統無法啟動，因為無法從 Contentful 載入資料');
      
      // 顯示錯誤訊息給用戶
      const heroCaption = document.getElementById('heroCaption');
      if (heroCaption) {
        heroCaption.innerHTML = `
          <div class="cap-title">Contentful 連線失敗</div>
          <div class="cap-desc">請檢查網路連線或 Contentful 設定</div>
        `;
        heroCaption.classList.add('visible');
      }
      
      // 不提供備用資料，直接結束
    });
  });

  function initializeHeroPlayer() {
    if (window.YT && window.YT.Player) {
      onYouTubeIframeAPIReady();
    } else {
      // 設定全域回調函數
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }
  }

  function onYouTubeIframeAPIReady() {
    if (!heroVideos.length || !heroOrder.length) {
      console.log('沒有 Hero 影片可播放');
      return;
    }

    const mask = document.getElementById('heroMask');
    if (mask) mask.classList.add('show'); // 先蓋遮罩

    heroPlayer = new YT.Player('ytPlayer', {
      videoId: heroOrder[0],
      playerVars: {
        autoplay: 1, 
        mute: 1, 
        controls: 0, 
        rel: 0, 
        showinfo: 0, 
        modestbranding: 1,
        playsinline: 1, 
        fs: 0, 
        disablekb: 1, 
        iv_load_policy: 3,
        cc_load_policy: 0,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: e => {
          e.target.mute();
          e.target.setPlaybackQuality('hd1440');
          e.target.playVideo();
          updateHeroCaption(0);
        },
        onStateChange: onPlayerStateChange,
        onError: () => { try { nextHero(); } catch (e) {} }
      }
    });
  }

  function onPlayerStateChange(event) {
    const mask = document.getElementById('heroMask');

    if (heroTimer) { clearTimeout(heroTimer); heroTimer = null; }
    if (mask) mask.classList.add('show'); // 預設蓋住

    if (event.data === YT.PlayerState.CUED) {
      try { heroPlayer.playVideo(); } catch {}
      return;
    }

    if (event.data === YT.PlayerState.PLAYING) {
      if (mask) mask.classList.remove('show');

      const currentVideoId = heroPlayer.getVideoData().video_id;
      if (ytIdToIndex.hasOwnProperty(currentVideoId)) {
        currentHeroIndex = ytIdToIndex[currentVideoId];
        heroPos = heroOrder.indexOf(currentVideoId);
        updateHeroCaption(currentHeroIndex);
        lastPlayedId = currentVideoId;
      }
      heroTimer = setTimeout(() => { try { nextHero(); } catch {} }, 10000);
    }

    if (event.data === YT.PlayerState.ENDED) {
      try { nextHero(); } catch {}
    }
  }

  function updateHeroCaption(index) {
    const captionEl = document.getElementById('heroCaption');
    if (captionEl && heroVideos[index]) {
      captionEl.innerHTML =
        `<div class="cap-title">${heroVideos[index].title || ''}</div>
         <div class="cap-desc">${heroVideos[index].desc || ''}</div>`;
      captionEl.classList.add('visible');
    }
  }

  function nextHero() {
    console.log(`🔄 切換到下一個 HERO 影片 (目前位置: ${heroPos}/${heroOrder.length})`);
    heroPos++;
    if (heroPos >= heroOrder.length) {
      // 重洗新一輪
      let arr = heroOrder.slice();
      let i = arr.length, r;
      while (i !== 0) {
        r = Math.floor(Math.random() * i);
        i--;
        [arr[i], arr[r]] = [arr[r], arr[i]];
      }
      if (arr.length > 1 && lastPlayedId && arr[0] === lastPlayedId) {
        [arr[0], arr[1]] = [arr[1], arr[0]];
      }
      heroOrder = arr;
      heroPos = 0;
    }

    let nextId = heroOrder[heroPos];
    if (lastPlayedId && nextId === lastPlayedId && heroOrder.length > 1) {
      heroPos = (heroPos + 1) % heroOrder.length;
      nextId = heroOrder[heroPos];
    }

    const mask = document.getElementById('heroMask');
    if (mask) mask.classList.add('show');

    const nextVideo = heroVideos[ytIdToIndex[nextId]];
    console.log(`▶️ 載入 HERO 影片: ${nextVideo?.title || nextId} (ID: ${nextId})`);
    heroPlayer.loadVideoById(nextId);
    try { heroPlayer.playVideo(); } catch {}
  }


  // === 全螢幕播放器（點精選卡片播放）===
  const fullscreenPlayerEl = document.getElementById('fullscreenPlayer');
  let fullscreenPlayerObject = null;

  document.body.addEventListener('click', e => {
    const btn = e.target?.closest?.('.video-cta');
    if (!btn) return;
    const id = btn.dataset.videoid;
    if (id) openFullscreenPlayer(id);
  });

  fullscreenPlayerEl?.addEventListener('click', e => {
    if (e.target && e.target.classList.contains('close-player-btn')) {
      closeFullscreenPlayer();
    }
  });

  function openFullscreenPlayer(videoId) {
    if (!fullscreenPlayerEl) return;
    // 暫停 Hero 計時與播放
    if (heroTimer) { clearTimeout(heroTimer); heroTimer = null; }
    try { heroPlayer?.pauseVideo?.(); } catch {}

    document.body.style.overflow = 'hidden';
    fullscreenPlayerEl.innerHTML = `
      <button class="close-player-btn" title="關閉">&times;</button>
      <div id="main-player"></div>`;
    fullscreenPlayerEl.classList.add('active');

    fullscreenPlayerObject = new YT.Player('main-player', {
      width: '100%',
      height: '100%',
      videoId,
      playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
      events: {
        onReady: ev => { ev.target.setPlaybackQuality('highres'); ev.target.playVideo(); }
      }
    });
  }

  function closeFullscreenPlayer() {
    if (!fullscreenPlayerEl) return;
    document.body.style.overflow = '';
    if (fullscreenPlayerObject?.destroy) {
      fullscreenPlayerObject.destroy();
      fullscreenPlayerObject = null;
    }
    fullscreenPlayerEl.innerHTML = '';
    fullscreenPlayerEl.classList.remove('active');

    // 回來後讓 Hero 繼續
    try { heroPlayer?.playVideo?.(); } catch {}
    if (!heroTimer) heroTimer = setTimeout(() => { try { nextHero(); } catch {} }, 10000);
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeFullscreenPlayer();
  });

  // === 分頁切換保險：離開暫停、回來繼續 ===
  document.addEventListener('visibilitychange', () => {
    if (!heroPlayer) return;
    if (document.hidden) {
      if (heroTimer) { clearTimeout(heroTimer); heroTimer = null; }
      try { heroPlayer.pauseVideo(); } catch {}
    } else {
      try { heroPlayer.playVideo(); } catch {}
      if (!heroTimer) heroTimer = setTimeout(() => { try { nextHero(); } catch {} }, 10000);
    }
  });
})();
