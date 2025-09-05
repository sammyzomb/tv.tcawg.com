// 節目同步系統 - 統一管理節目資料
// 版本：1.0.0
// 功能：統一節目資料管理，支援多設備同步

window.ProgramSyncSystem = {
  // 資料來源配置
  dataSources: {
    local: 'localStorage',
    json: 'jsonFiles',
    contentful: 'contentful', // 主要資料來源
    firebase: 'firebase' // 未來擴展
  },

  // 當前使用的資料來源
  currentSource: 'contentful',

  // 節目資料結構
  programSchema: {
    id: 'string',
    title: 'string',
    description: 'string',
    category: 'string',
    duration: 'number',
    videoType: 'string', // 'youtube' | 'mp4'
    videoId: 'string',
    thumbnail: 'string',
    status: 'string', // 'published' | 'scheduled' | 'draft'
    publishDate: 'string',
    views: 'number',
    createdAt: 'string',
    updatedAt: 'string',
    createdBy: 'string'
  },

  // 初始化系統
  init() {
    console.log('節目同步系統初始化...');
    this.loadPrograms();
    this.setupAutoSync();
    this.checkForUpdates();
  },

  // 載入節目資料
  async loadPrograms() {
    try {
      // 優先從 Contentful 載入
      if (this.currentSource === 'contentful') {
        await this.loadFromContentful();
        return;
      }

      // 備用：從 localStorage 載入
      const localData = localStorage.getItem('tv_programs_sync');
      if (localData) {
        this.programs = JSON.parse(localData);
        console.log(`從 localStorage 載入 ${this.programs.length} 個節目`);
        return;
      }

      // 最後備用：從 JSON 檔案載入
      await this.loadFromJSONFiles();
    } catch (error) {
      console.error('載入節目資料失敗:', error);
      this.programs = [];
    }
  },

  // 從 Contentful 載入節目
  async loadFromContentful() {
    try {
      console.log('正在從 Contentful 載入節目...');
      
      // 檢查 Contentful 客戶端是否可用
      if (!window.contentful || !window.contentfulAPI) {
        console.warn('Contentful 客戶端未載入，嘗試載入...');
        await this.loadContentfulClient();
      }

      if (!window.contentfulAPI) {
        throw new Error('Contentful 客戶端載入失敗');
      }

      // 載入節目資料
      const programs = await this.fetchContentfulPrograms();
      this.programs = programs;
      
      // 同時儲存到 localStorage 作為快取
      this.savePrograms();
      
      console.log(`從 Contentful 載入 ${this.programs.length} 個節目`);
    } catch (error) {
      console.error('從 Contentful 載入失敗:', error);
      // 降級到 localStorage
      const localData = localStorage.getItem('tv_programs_sync');
      if (localData) {
        this.programs = JSON.parse(localData);
        console.log(`降級到 localStorage，載入 ${this.programs.length} 個節目`);
      } else {
        this.programs = [];
      }
    }
  },

  // 載入 Contentful 客戶端
  async loadContentfulClient() {
    return new Promise((resolve, reject) => {
      // 檢查是否已經載入
      if (window.contentful && window.contentfulAPI) {
        resolve();
        return;
      }

      // 載入 Contentful SDK
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/contentful@latest/dist/contentful.browser.min.js';
      script.onload = () => {
        // 載入 Contentful API 設定
        const apiScript = document.createElement('script');
        apiScript.src = 'contentful-api.js';
        apiScript.onload = () => {
          resolve();
        };
        apiScript.onerror = () => {
          reject(new Error('無法載入 contentful-api.js'));
        };
        document.head.appendChild(apiScript);
      };
      script.onerror = () => {
        reject(new Error('無法載入 Contentful SDK'));
      };
      document.head.appendChild(script);
    });
  },

  // 從 Contentful 獲取節目
  async fetchContentfulPrograms() {
    try {
      // 嘗試多種內容類型
      const contentTypes = ['scheduleItem', 'program', 'videoAsset', 'programTemplate'];
      const allPrograms = [];

      for (const contentType of contentTypes) {
        try {
          const response = await window.contentfulAPI.client.getEntries({
            content_type: contentType,
            include: 2,
            limit: 1000
          });

          const programs = response.items.map(item => this.convertContentfulItem(item));
          allPrograms.push(...programs);
        } catch (error) {
          console.log(`無法載入內容類型 ${contentType}:`, error.message);
        }
      }

      // 如果沒有找到任何節目，嘗試載入所有內容
      if (allPrograms.length === 0) {
        console.log('嘗試載入所有 Contentful 內容...');
        const response = await window.contentfulAPI.client.getEntries({
          include: 2,
          limit: 1000
        });

        allPrograms.push(...response.items.map(item => this.convertContentfulItem(item)));
      }

      return allPrograms;
    } catch (error) {
      console.error('從 Contentful 獲取節目失敗:', error);
      return [];
    }
  },

  // 轉換 Contentful 項目為標準格式
  convertContentfulItem(item) {
    const fields = item.fields || {};
    
    return {
      id: item.sys.id,
      title: fields.節目標題 || fields.title || fields.templateName || '未命名節目',
      description: fields.節目描述 || fields.description || '',
      category: fields.節目分類 || fields.category || '未分類',
      duration: fields.節目時長 || fields.duration || 30,
      videoType: fields.videoType || 'youtube',
      videoId: fields.YouTubeID || fields.videoId || fields.ytid || '',
      thumbnail: this.getContentfulImageUrl(fields.節目縮圖 || fields.thumbnail),
      status: fields.節目狀態 || fields.status || 'published',
      publishDate: fields.播出日期 || fields.publishDate || new Date().toISOString().split('T')[0],
      views: fields.views || 0,
      createdAt: item.sys.createdAt,
      updatedAt: item.sys.updatedAt,
      createdBy: 'contentful',
      scheduleTime: fields.播出時間 || fields.scheduleTime,
      contentType: item.sys.contentType?.sys?.id || 'unknown'
    };
  },

  // 獲取 Contentful 圖片 URL
  getContentfulImageUrl(imageField) {
    if (!imageField) return '';
    
    if (typeof imageField === 'string') {
      return imageField;
    }
    
    if (imageField.fields && imageField.fields.file) {
      return `https:${imageField.fields.file.url}`;
    }
    
    return '';
  },

  // 從 JSON 檔案載入節目
  async loadFromJSONFiles() {
    try {
      // 載入 videos.json
      const videosResponse = await fetch('videos.json');
      const videosData = await videosResponse.json();
      
      // 載入 schedule.json
      const scheduleResponse = await fetch('schedule.json');
      const scheduleData = await scheduleResponse.json();

      // 合併資料
      this.programs = this.mergeJSONData(videosData, scheduleData);
      
      // 儲存到 localStorage
      this.savePrograms();
      
      console.log(`從 JSON 檔案載入並合併 ${this.programs.length} 個節目`);
    } catch (error) {
      console.error('從 JSON 檔案載入失敗:', error);
      this.programs = [];
    }
  },

  // 合併 JSON 資料
  mergeJSONData(videosData, scheduleData) {
    const programs = [];
    
    // 處理 videos.json 資料
    if (Array.isArray(videosData)) {
      videosData.forEach(video => {
        programs.push({
          id: video.id || `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: video.title,
          description: video.desc || '',
          category: video.category || '未分類',
          duration: 30, // 預設 30 分鐘
          videoType: video.type || 'youtube',
          videoId: video.ytid || video.src || '',
          thumbnail: video.thumb || '',
          status: 'published',
          publishDate: new Date().toISOString().split('T')[0],
          views: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system',
          region: video.region,
          country: video.country
        });
      });
    }

    // 處理 schedule.json 資料
    if (scheduleData.today && scheduleData.today.schedule) {
      scheduleData.today.schedule.forEach(schedule => {
        // 檢查是否已存在相同標題的節目
        const existingProgram = programs.find(p => p.title === schedule.title);
        if (!existingProgram) {
          programs.push({
            id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: schedule.title,
            description: schedule.description || '',
            category: schedule.category || '未分類',
            duration: parseInt(schedule.duration) || 30,
            videoType: 'youtube',
            videoId: '',
            thumbnail: schedule.thumbnail || '',
            status: 'published',
            publishDate: new Date().toISOString().split('T')[0],
            views: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'system',
            scheduleTime: schedule.time
          });
        }
      });
    }

    return programs;
  },

  // 儲存節目資料
  savePrograms() {
    try {
      localStorage.setItem('tv_programs_sync', JSON.stringify(this.programs));
      console.log(`已儲存 ${this.programs.length} 個節目到 localStorage`);
      
      // 觸發同步事件
      this.triggerSyncEvent('saved');
    } catch (error) {
      console.error('儲存節目資料失敗:', error);
    }
  },

  // 新增節目
  addProgram(programData) {
    const program = {
      id: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: programData.title,
      description: programData.description || '',
      category: programData.category || '未分類',
      duration: programData.duration || 30,
      videoType: programData.videoType || 'youtube',
      videoId: programData.videoId || '',
      thumbnail: programData.thumbnail || '',
      status: programData.status || 'published',
      publishDate: programData.publishDate || new Date().toISOString().split('T')[0],
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: programData.createdBy || 'admin'
    };

    this.programs.push(program);
    this.savePrograms();
    
    console.log(`新增節目: ${program.title} (ID: ${program.id})`);
    this.triggerSyncEvent('added', program);
    
    return program;
  },

  // 更新節目
  updateProgram(programId, updateData) {
    const programIndex = this.programs.findIndex(p => p.id === programId);
    if (programIndex === -1) {
      throw new Error('找不到指定的節目');
    }

    const program = this.programs[programIndex];
    Object.assign(program, updateData);
    program.updatedAt = new Date().toISOString();

    this.savePrograms();
    console.log(`更新節目: ${program.title}`);
    this.triggerSyncEvent('updated', program);
    
    return program;
  },

  // 刪除節目
  deleteProgram(programId) {
    const programIndex = this.programs.findIndex(p => p.id === programId);
    if (programIndex === -1) {
      throw new Error('找不到指定的節目');
    }

    const program = this.programs[programIndex];
    this.programs.splice(programIndex, 1);
    this.savePrograms();
    
    console.log(`刪除節目: ${program.title}`);
    this.triggerSyncEvent('deleted', program);
    
    return program;
  },

  // 搜尋節目
  searchPrograms(query, category = null, status = null) {
    let filteredPrograms = this.programs.filter(program => {
      const matchesQuery = !query || 
        program.title.toLowerCase().includes(query.toLowerCase()) ||
        program.description.toLowerCase().includes(query.toLowerCase()) ||
        program.category.toLowerCase().includes(query.toLowerCase());

      const matchesCategory = !category || program.category === category;
      const matchesStatus = !status || program.status === status;

      return matchesQuery && matchesCategory && matchesStatus;
    });

    // 按更新時間排序
    filteredPrograms.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return filteredPrograms;
  },

  // 獲取節目統計
  getStats() {
    const stats = {
      total: this.programs.length,
      published: this.programs.filter(p => p.status === 'published').length,
      scheduled: this.programs.filter(p => p.status === 'scheduled').length,
      draft: this.programs.filter(p => p.status === 'draft').length,
      totalViews: this.programs.reduce((sum, p) => sum + p.views, 0),
      byCategory: {}
    };

    // 按分類統計
    this.programs.forEach(program => {
      if (!stats.byCategory[program.category]) {
        stats.byCategory[program.category] = 0;
      }
      stats.byCategory[program.category]++;
    });

    return stats;
  },

  // 匯出節目資料
  exportPrograms() {
    return {
      programs: this.programs,
      stats: this.getStats(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  },

  // 匯入節目資料
  importPrograms(data) {
    if (data.programs && Array.isArray(data.programs)) {
      this.programs = data.programs;
      this.savePrograms();
      console.log(`已匯入 ${this.programs.length} 個節目`);
      this.triggerSyncEvent('imported');
      return true;
    }
    return false;
  },

  // 檢查更新
  async checkForUpdates() {
    try {
      if (this.currentSource === 'contentful') {
        await this.loadFromContentful();
        console.log('檢查 Contentful 更新完成');
      } else {
        await this.loadFromJSONFiles();
        console.log('檢查 JSON 檔案更新完成');
      }
    } catch (error) {
      console.log('檢查更新失敗:', error);
    }
  },

  // 設置自動同步
  setupAutoSync() {
    // 每 5 分鐘檢查一次更新
    setInterval(() => {
      this.checkForUpdates();
    }, 5 * 60 * 1000);

    // 監聽頁面可見性變化
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkForUpdates();
      }
    });
  },

  // 觸發同步事件
  triggerSyncEvent(type, data = null) {
    const event = new CustomEvent('programSync', {
      detail: { type, data, timestamp: new Date().toISOString() }
    });
    document.dispatchEvent(event);
  },

  // 手動同步
  manualSync() {
    console.log('開始手動同步...');
    this.checkForUpdates();
    this.triggerSyncEvent('manualSync');
  },

  // 清除所有資料
  clearAllData() {
    if (confirm('確定要清除所有節目資料嗎？此操作無法撤銷！')) {
      this.programs = [];
      localStorage.removeItem('tv_programs_sync');
      console.log('已清除所有節目資料');
      this.triggerSyncEvent('cleared');
    }
  }
};

// 初始化系統
document.addEventListener('DOMContentLoaded', function() {
  window.ProgramSyncSystem.init();
});

console.log('節目同步系統已載入');
