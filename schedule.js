// 節目表頁面專用JavaScript
document.addEventListener('DOMContentLoaded', () => {
  let currentWeek = 0; // 0 = 本週, -1 = 上週, 1 = 下週
  let currentDay = 'monday';
  let scheduleData = null;

  // 初始化
  initSchedulePage();

  // 初始化節目表頁面
  async function initSchedulePage() {
    await loadScheduleData();
    setupEventListeners();
    updateWeekDisplay();
    loadDaySchedule(currentDay);
    
    // 每分鐘更新一次節目狀態
    setInterval(() => {
      loadDaySchedule(currentDay);
    }, 60000);
  }

  // 載入節目數據
  async function loadScheduleData() {
    try {
      // 優先嘗試從 Contentful 載入
      if (typeof contentful !== 'undefined') {
        console.log('🎯 從 Contentful 載入節目數據...');
        
        const client = contentful.createClient({
          space: 'os5wf90ljenp',
          accessToken: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0'
        });
        
        const response = await client.getEntries({
          content_type: 'scheduleItem',
          include: 2,
          limit: 1000
        });
        
        if (response.items && response.items.length > 0) {
          console.log(`✅ 從 Contentful 載入 ${response.items.length} 個節目`);
          scheduleData = convertContentfulToScheduleFormat(response.items);
          
          // 檢查標籤數據
          let programsWithTags = 0;
          Object.keys(scheduleData).forEach(day => {
            if (scheduleData[day].schedule) {
              scheduleData[day].schedule.forEach(program => {
                if (program.tags && program.tags.length > 0) {
                  programsWithTags++;
                  console.log('🔍 節目標籤:', { title: program.title, tags: program.tags });
                }
              });
            }
          });
          console.log(`📊 總共 ${programsWithTags} 個節目有標籤數據`);
          
          return;
        }
      }
      
      // 直接載入本地 JSON
      const response = await fetch('schedule.json');
      scheduleData = await response.json();
      console.log('✅ 從本地 schedule.json 載入節目數據');
      
    } catch (error) {
      console.error('載入節目數據失敗:', error);
      // 使用預設數據
      scheduleData = {
        today: {
          schedule: []
        }
      };
    }
  }
  
  // 從備註中提取主題標籤
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
        allTopics.push(...topic.split(',').map(t => t.trim()));
      } else {
        allTopics.push(topic.trim());
      }
    });
    
    return allTopics.filter(topic => topic.length > 0);
  }

  // 從備註中提取分類
  function extractCategoryFromNotes(notes) {
    if (!notes) return '旅遊節目';
    const match = notes.match(/\[分類:(.*?)\]/);
    return match ? match[1] : '旅遊節目';
  }

  // 將 Contentful 數據轉換為節目表格式
  function convertContentfulToScheduleFormat(items) {
    const scheduleData = {};
    
    items.forEach(item => {
      const fields = item.fields;
      const airDate = fields.airDate;
      const title = fields.title;
      const notes = fields.notes || '';
      
      // 從備註中提取具體時間，格式為 [時間:XX:XX]
      const timeMatch = notes.match(/\[時間:(\d{2}:\d{2})\]/);
      const actualTime = timeMatch ? timeMatch[1] : '12:00';
      
      // 從備註中提取 YouTube ID，格式為 [YouTube:XXXXX]
      const youtubeMatch = notes.match(/\[YouTube:([^\]]+)\]/);
      const youtubeId = youtubeMatch ? youtubeMatch[1] : '';
      
      // 計算日期對應的星期幾
      const date = new Date(airDate);
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      
      // 初始化日期數據
      if (!scheduleData[dayName]) {
        scheduleData[dayName] = {
          date: airDate,
          dayOfWeek: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
          month: (date.getMonth() + 1).toString(),
          day: date.getDate().toString(),
          schedule: []
        };
      }
      
      // 清理描述文字，移除時間和 YouTube 標記
      let cleanDescription = notes
        .replace(/\[時間:\d{2}:\d{2}\]/g, '')
        .replace(/\[YouTube:[^\]]+\]/g, '')
        .replace(/\[分類:.*?\]/g, '')
        .replace(/\[主題:.*?\]/g, '')
        .trim();
      
      // 如果沒有描述，使用標題
      if (!cleanDescription) {
        cleanDescription = title;
      }
      
      // 添加節目到對應日期
      const program = {
        time: actualTime,
        title: title,
        duration: '30', // 預設 30 分鐘
        category: extractCategoryFromNotes(notes),
        description: cleanDescription,
        thumbnail: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop',
        youtubeId: youtubeId,
        tags: extractTopicsFromNotes(notes),
        status: 'published'
      };
      
      // 檢查是否已存在相同時間和標題的節目，避免重複
      const existingProgram = scheduleData[dayName].schedule.find(p => 
        p.time === actualTime && p.title === title && p.youtubeId === youtubeId
      );
      
      if (!existingProgram) {
        scheduleData[dayName].schedule.push(program);
      } else {
        console.log(`⚠️ 跳過重複節目: ${title} (${actualTime})`);
      }
    });
    
    // 按時間排序每個日期的節目，並進行最終去重
    Object.keys(scheduleData).forEach(day => {
      scheduleData[day].schedule.sort((a, b) => a.time.localeCompare(b.time));
      
      // 最終去重：移除相同時間、標題和 YouTube ID 的重複節目
      const uniquePrograms = [];
      const seen = new Set();
      
      scheduleData[day].schedule.forEach(program => {
        const key = `${program.time}-${program.title}-${program.youtubeId}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniquePrograms.push(program);
        } else {
          console.log(`🗑️ 移除重複節目: ${program.title} (${program.time})`);
        }
      });
      
      scheduleData[day].schedule = uniquePrograms;
    });
    
    return scheduleData;
  }

  // 設置事件監聽器
  function setupEventListeners() {
    // 週導覽按鈕
    document.getElementById('prevWeek')?.addEventListener('click', () => {
      currentWeek--;
      updateWeekDisplay();
      loadDaySchedule(currentDay);
    });

    document.getElementById('nextWeek')?.addEventListener('click', () => {
      currentWeek++;
      updateWeekDisplay();
      loadDaySchedule(currentDay);
    });

    // 日期標籤
    document.querySelectorAll('.schedule-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const day = tab.dataset.day;
        if (day && day !== currentDay) {
          currentDay = day;
          updateActiveTab();
          loadDaySchedule(day);
        }
      });
    });

    // 模態框關閉
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('program-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'program-modal') {
        closeModal();
      }
    });

    // ESC鍵關閉模態框
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  // 獲取台灣時間
  function getTaiwanTime() {
    const now = new Date();
    // 使用更精確的台灣時區轉換
    const taiwanOffset = 8 * 60; // 台灣時區 UTC+8
    const localOffset = now.getTimezoneOffset(); // 本地時區偏移（分鐘）
    const taiwanTime = new Date(now.getTime() + (taiwanOffset + localOffset) * 60 * 1000);
    return taiwanTime;
  }

  // 更新週顯示（使用台灣時間）
  function updateWeekDisplay() {
    const weekDateRange = document.getElementById('weekDateRange');
    if (!weekDateRange) return;

    const taiwanTime = getTaiwanTime();
    const weekStart = new Date(taiwanTime);
    weekStart.setUTCDate(taiwanTime.getUTCDate() - taiwanTime.getUTCDay() + 1 + (currentWeek * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

    const formatDate = (date) => {
      return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
    };

    weekDateRange.textContent = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    
    // 更新當前日期標籤
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayIndex = taiwanTime.getUTCDay();
    currentDay = dayNames[currentDayIndex]; // 直接使用當天的索引
    
    // 更新活動標籤
    updateActiveTab();
  }

  // 更新活動標籤
  function updateActiveTab() {
    document.querySelectorAll('.schedule-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-day="${currentDay}"]`)?.classList.add('active');
  }

  // 載入指定日期的節目表
  function loadDaySchedule(day) {
    const contentEl = document.getElementById('schedule-day-content');
    if (!contentEl) return;

    // 根據選擇的日期載入對應的節目數據
    const programs = scheduleData?.[day]?.schedule || [];
    
    if (programs.length === 0) {
      contentEl.innerHTML = `
        <div class="schedule-empty">
          <div class="empty-icon">📺</div>
          <h3>暫無節目安排</h3>
          <p>該時段目前沒有節目安排，請稍後再查看</p>
        </div>
      `;
      return;
    }

    // 顯示所有節目，不過濾已播放的節目
    const filteredPrograms = programs;

    // 創建節目表
    const scheduleHTML = `
      <div class="schedule-list">
        ${filteredPrograms.map(program => createProgramItem(program)).join('')}
      </div>
    `;

    contentEl.innerHTML = scheduleHTML;

    // 添加節目點擊事件
    document.querySelectorAll('.schedule-item').forEach((item, index) => {
      item.addEventListener('click', () => {
        openProgramModal(filteredPrograms[index]);
      });
    });
  }

  // 創建節目項目
  function createProgramItem(program) {
    // 標籤翻譯映射（與 admin-calendar-unified.html 中的 TOPICS_DATA 保持一致）
    const TAG_TRANSLATIONS = {
      'city-secrets': '城市秘境',
      'taste-journal': '味覺日誌',
      'travel-talk': '旅途談',
      'around-world': '繞著地球跑',
      'food-talk': '食話實說',
      'play-fun': '玩樂FUN',
      'time-walk': '時光漫遊',
      'nature-secrets': '自然秘境'
    };

    // 翻譯標籤函數
    const translateTags = (tags) => {
      if (!Array.isArray(tags)) return [];
      return tags.map(tag => TAG_TRANSLATIONS[tag] || tag);
    };

    // 處理標籤
    const tags = program.tags ? translateTags(program.tags) : [];
    const tagsHtml = tags.length > 0 ? 
      `<div class="program-tags">
        ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>` : '';

    return `
      <div class="schedule-item">
        <div class="schedule-thumbnail">
          <img src="${program.thumbnail}" alt="${escapeHtml(program.title)}" loading="lazy">
          <div class="schedule-time">${program.time}</div>
        </div>
        <div class="schedule-content">
          <div class="program-title">${escapeHtml(program.title)}</div>
          <div class="program-description">${escapeHtml(program.description)}</div>
          <div class="schedule-meta">
            <div class="program-category">${escapeHtml(program.category)}</div>
            <div class="schedule-duration">${program.duration}分</div>
          </div>
          ${tagsHtml}
        </div>
      </div>
    `;
  }

  // 判斷是否為已播放過的節目
  function isPastProgram(program) {
    const taiwanTime = getTaiwanTime();
    const currentTime = taiwanTime.getUTCHours() * 60 + taiwanTime.getUTCMinutes();
    
    const [programHour, programMinute] = program.time.split(':').map(Number);
    const programStartTime = programHour * 60 + programMinute;
    const programEndTime = programStartTime + parseInt(program.duration);
    
    return currentTime >= programEndTime;
  }

  // 判斷是否為當前節目（使用台灣時間）
  function isCurrentProgram(program) {
    const taiwanTime = getTaiwanTime();
    const currentTime = taiwanTime.getUTCHours() * 60 + taiwanTime.getUTCMinutes();
    
    const [programHour, programMinute] = program.time.split(':').map(Number);
    const programStartTime = programHour * 60 + programMinute;
    const programEndTime = programStartTime + parseInt(program.duration);
    
    return currentTime >= programStartTime && currentTime < programEndTime;
  }

  // 判斷是否為下一個節目
  function isNextProgram(program) {
    const taiwanTime = getTaiwanTime();
    const currentTime = taiwanTime.getUTCHours() * 60 + taiwanTime.getUTCMinutes();
    
    const [programHour, programMinute] = program.time.split(':').map(Number);
    const programStartTime = programHour * 60 + programMinute;
    
    // 找到當前節目
    const programs = scheduleData?.[currentDay]?.schedule || [];
    const currentProgram = programs.find(p => isCurrentProgram(p));
    
    if (!currentProgram) {
      // 如果沒有當前節目，第一個未播放的節目就是下一個
      return !isPastProgram(program) && !isCurrentProgram(program);
    }
    
    // 找到當前節目的結束時間
    const [currentHour, currentMinute] = currentProgram.time.split(':').map(Number);
    const currentStartTime = currentHour * 60 + currentMinute;
    const currentEndTime = currentStartTime + parseInt(currentProgram.duration);
    
    // 下一個節目是緊接在當前節目之後的節目
    return programStartTime === currentEndTime;
  }

  // 打開節目詳情模態框
  function openProgramModal(program) {
    const modal = document.getElementById('program-modal');
    if (!modal) return;

    // 填充模態框內容
    document.getElementById('modalProgramImage').src = program.thumbnail || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop';
    document.getElementById('modalProgramTime').textContent = program.time;
    document.getElementById('modalProgramTitle').textContent = program.title;
    document.getElementById('modalProgramCategory').textContent = program.category;
    document.getElementById('modalProgramDuration').textContent = `${program.duration}分鐘`;
    document.getElementById('modalProgramDescription').textContent = program.description;

    // 顯示模態框
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // 關閉模態框
  function closeModal() {
    const modal = document.getElementById('program-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // 轉義HTML
  function escapeHtml(s='') {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
});

// 添加節目表空狀態樣式
const style = document.createElement('style');
style.textContent = `
  .schedule-empty {
    padding: 60px 20px;
    text-align: center;
    color: var(--text-color-light);
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 20px;
  }
  
  .schedule-empty h3 {
    font-size: 1.5rem;
    margin: 0 0 10px 0;
    color: var(--text-color);
  }
  
  .schedule-empty p {
    font-size: 1rem;
    margin: 0;
    opacity: 0.8;
  }
`;
document.head.appendChild(style);
