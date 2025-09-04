// featured.js：精選節目（每頁 8 個，導到 videos.html）
(function(){
  // 備用精選節目資料（當 Contentful 無法連接時使用）
  const fallbackFeaturedVideos = [
    {
      title: "雅加達 千島群島 浮潛",
      desc: "潛入海洋，探索繽紛的熱帶生態",
      ytid: "3GZCJfIOg_k",
      tags: ["印尼", "浮潛", "海洋"]
    },
    {
      title: "雅加達 火山",
      desc: "走訪壯觀的活火山與地熱奇景",
      ytid: "LcdGhVwS3gw",
      tags: ["印尼", "火山", "地熱"]
    },
    {
      title: "俄羅斯 莫斯科 紅場",
      desc: "走進俄羅斯歷史心臟，宏偉紅場",
      ytid: "25Fmx1G-C3k",
      tags: ["俄羅斯", "莫斯科", "歷史"]
    },
    {
      title: "極光",
      desc: "追尋極地夜空中最美的奇幻光芒",
      ytid: "u4XvG8jkToY",
      tags: ["極光", "北極", "自然奇觀"]
    },
    {
      title: "挪威峽灣郵輪",
      desc: "郵輪穿越冰河峽灣，壯闊如畫",
      ytid: "jLNBKAFgtNU",
      tags: ["挪威", "峽灣", "郵輪"]
    },
    {
      title: "祕魯 馬丘比丘",
      desc: "攀上神秘古城，領略印加文明",
      ytid: "QoHTSSS3DwQ",
      tags: ["祕魯", "馬丘比丘", "古文明"]
    },
    {
      title: "阿根廷 伊瓜蘇瀑布",
      desc: "感受壯闊奔騰的南美大瀑布",
      ytid: "BDnpjQmGRqY",
      tags: ["阿根廷", "瀑布", "自然奇觀"]
    },
    {
      title: "非洲 獵豹",
      desc: "非洲原野，見證速度與野性",
      ytid: "8YFLi5hZ2lc",
      tags: ["非洲", "野生動物", "獵豹"]
    }
  ];

  // 初始化 Contentful client
  const contentfulClient = contentful.createClient({
    space: 'os5wf90ljenp',
    accessToken: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0'
  });

  // HTML 轉義函數
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('featured-videos');
    if (!container) return;

    const pick = (f, keys) => {
      for (const k of keys) { if (f && f[k] != null && f[k] !== '') return f[k]; }
      return '';
    };
    const limitText = (txt, max) => !txt ? '' : (txt.length > max ? txt.slice(0, max) + '…' : txt);

    try {
      const entries = await contentfulClient.getEntries({
        content_type: 'video',
        'fields.isFeatured': true,
        order: '-sys.updatedAt',
        limit: 100
      });

      let allItems = (entries.items || []).map(it => {
        const f = it.fields || {};
        const title = pick(f, ['影片標題','title']);
        const desc  = pick(f, ['精選推薦影片說明文字','description']);
        const ytid  = pick(f, ['YouTube ID','youTubeId','youtubeId']);
        const mp4   = pick(f, ['MP4 影片網址','mp4Url']);
        const tags  = Array.isArray(f.tags) ? f.tags : [];
        let thumb = '';
        const cfThumb = f.thumbnail?.fields?.file?.url;
        if (cfThumb) thumb = cfThumb.startsWith('http') ? cfThumb : `https:${cfThumb}`;
        else if (ytid) thumb = `https://i.ytimg.com/vi/${ytid}/hqdefault.jpg`;
        return { title, desc, ytid, mp4, tags, thumb };
      });

      // 如果 Contentful 沒有資料，使用備用資料
      if (!allItems.length) {
        console.log('Contentful 中沒有精選節目，使用備用資料');
        allItems = fallbackFeaturedVideos.map(v => ({
          ...v,
          thumb: `https://i.ytimg.com/vi/${v.ytid}/hqdefault.jpg`
        }));
      }

      const PAGE_SIZE = 8;
      let rendered = 0;

      const moreWrap = document.createElement('div');
      moreWrap.id = 'featured-actions';
      moreWrap.style = 'text-align:center;margin-top:16px;';
      const moreLink = document.createElement('a');
      moreLink.id = 'featured-more';
      moreLink.href = 'videos.html';
      moreLink.className = 'video-more-btn';
      moreLink.textContent = '所有節目';
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
        moreWrap.style.display = allItems.length ? '' : 'none';
      }

      container.innerHTML = '';
      if (allItems.length === 0) {
        container.innerHTML = `<p style="color:#999;">目前無法載入精選節目。</p>`;
        moreWrap.style.display = 'none';
      } else {
        renderNextPage();
      }
    } catch (err) {
      console.error('Contentful 連線失敗（featured）：', err);
      if (container) container.innerHTML = `<p style="color:#999;">目前無法載入精選節目。</p>`;
    }
  });
})();
