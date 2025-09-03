// program-management-system.js - 節目管理系統
// 版本：1.0.0
// 建立日期：2025-08-31
// 功能：管理節目時段、首播邏輯和搜尋控制

window.ProgramManagementSystem = {
  // 節目時段定義
  timeSlots: {
    '00:00-06:00': {
      name: '深夜時段',
      startHour: 0,
      endHour: 6,
      slots: 12,
      canFirstAir: false,
      description: '深夜重播時段'
    },
    '06:00-12:00': {
      name: '晨間時段',
      startHour: 6,
      endHour: 12,
      slots: 12,
      canFirstAir: false,
      description: '晨間重播時段'
    },
    '12:00-18:00': {
      name: '首播時段',
      startHour: 12,
      endHour: 18,
      slots: 12,
      canFirstAir: true,
      description: '🌟 首播放置區 - 新節目首播時段'
    },
    '18:00-24:00': {
      name: '晚間時段',
      startHour: 18,
      endHour: 24,
      slots: 12,
      canFirstAir: false,
      description: '晚間重播時段'
    }
  },

  // 節目狀態定義
  programStatus: {
    FIRST_AIR: '首播',
    REPLAY: '重播',
    SPECIAL: '特別節目',
    ARCHIVED: '已歸檔'
  },

  // 節目分類
  categories: [
    '亞洲旅遊',
    '歐洲旅遊', 
    '美洲旅遊',
    '美食旅遊',
    '極地旅遊',
    '自然旅遊',
    '文化旅遊',
    '冒險旅遊'
  ],

  // 初始化系統
  init() {
    console.log('節目管理系統初始化...');
    this.loadPrograms();
    this.updateFirstAirStatus();
    this.setupAutoUpdate();
  },

  // 載入節目資料
  loadPrograms() {
    try {
      const saved = localStorage.getItem('tv_programs_data');
      if (saved) {
        this.programs = JSON.parse(saved);
        console.log(`已載入 ${this.programs.length} 個節目`);
      } else {
        this.programs = [];
        console.log('沒有找到節目資料，建立新的節目庫');
      }
    } catch (error) {
      console.error('載入節目資料失敗:', error);
      this.programs = [];
    }
  },

  // 儲存節目資料
  savePrograms() {
    try {
      localStorage.setItem('tv_programs_data', JSON.stringify(this.programs));
      console.log(`已儲存 ${this.programs.length} 個節目`);
    } catch (error) {
      console.error('儲存節目資料失敗:', error);
    }
  },

  // 生成時間槽
  generateTimeSlots() {
    const allSlots = [];
    
    Object.entries(this.timeSlots).forEach(([period, config]) => {
      for (let i = 0; i < config.slots; i++) {
        const hour = config.startHour + Math.floor(i / 2);
        const minute = (i % 2) * 30;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        allSlots.push({
          time: timeString,
          period: period,
          periodName: config.name,
          canFirstAir: config.canFirstAir,
          description: config.description
        });
      }
    });
    
    return allSlots;
  },

  // 檢查時間槽是否可用於首播
  canScheduleFirstAir(time) {
    const [hour] = time.split(':').map(Number);
    return hour >= 12 && hour < 18;
  },

  // 新增節目
  addProgram(programData) {
    const program = {
      id: this.generateProgramId(),
      title: programData.title,
      description: programData.description || '',
      category: programData.category,
      duration: programData.duration || 30,
      videoType: programData.videoType || 'YouTube',
      videoId: programData.videoId || '',
      thumbnail: programData.thumbnail || '',
      status: programData.status || this.programStatus.REPLAY,
      firstAirDate: null,
      firstAirTime: null,
      isFirstAirCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: programData.createdBy || 'admin',
      tags: programData.tags || [],
      rating: programData.rating || 0,
      viewCount: 0
    };

    // 如果是首播，設定首播時間
    if (program.status === this.programStatus.FIRST_AIR) {
      if (!this.canScheduleFirstAir(programData.airTime)) {
        throw new Error('首播只能在 12:00-18:00 時段安排');
      }
      program.firstAirDate = programData.airDate;
      program.firstAirTime = programData.airTime;
    }

    this.programs.push(program);
    this.savePrograms();
    
    console.log(`新增節目: ${program.title} (ID: ${program.id})`);
    return program;
  },

  // 更新節目
  updateProgram(programId, updateData) {
    const program = this.programs.find(p => p.id === programId);
    if (!program) {
      throw new Error('找不到指定的節目');
    }

    // 更新欄位
    Object.assign(program, updateData);
    program.updatedAt = new Date().toISOString();

    // 如果狀態改為首播，檢查時間限制
    if (updateData.status === this.programStatus.FIRST_AIR) {
      if (!this.canScheduleFirstAir(updateData.airTime)) {
        throw new Error('首播只能在 12:00-18:00 時段安排');
      }
      program.firstAirDate = updateData.airDate;
      program.firstAirTime = updateData.airTime;
    }

    this.savePrograms();
    console.log(`更新節目: ${program.title}`);
    return program;
  },

  // 刪除節目
  deleteProgram(programId) {
    const index = this.programs.findIndex(p => p.id === programId);
    if (index === -1) {
      throw new Error('找不到指定的節目');
    }

    const program = this.programs[index];
    this.programs.splice(index, 1);
    this.savePrograms();
    
    console.log(`刪除節目: ${program.title}`);
    return program;
  },

  // 生成節目 ID
  generateProgramId() {
    return 'prog_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // 更新首播狀態
  updateFirstAirStatus() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    this.programs.forEach(program => {
      if (program.status === this.programStatus.FIRST_AIR && 
          program.firstAirDate && 
          program.firstAirTime &&
          !program.isFirstAirCompleted) {
        
        // 檢查首播是否已完成
        if (program.firstAirDate < currentDate || 
            (program.firstAirDate === currentDate && program.firstAirTime <= currentTime)) {
          
          program.isFirstAirCompleted = true;
          program.status = this.programStatus.REPLAY;
          program.updatedAt = new Date().toISOString();
          
          console.log(`首播完成: ${program.title} - 現在可以搜尋觀看`);
        }
      }
    });

    this.savePrograms();
  },

  // 搜尋節目（排除未完成首播的節目）
  searchPrograms(query, category = null, includeFirstAir = false) {
    let filteredPrograms = this.programs.filter(program => {
      // 排除未完成首播的節目（除非特別要求包含）
      if (program.status === this.programStatus.FIRST_AIR && 
          !program.isFirstAirCompleted && 
          !includeFirstAir) {
        return false;
      }

      // 搜尋條件
      const matchesQuery = !query || 
        program.title.toLowerCase().includes(query.toLowerCase()) ||
        program.description.toLowerCase().includes(query.toLowerCase()) ||
        program.category.toLowerCase().includes(query.toLowerCase());

      const matchesCategory = !category || program.category === category;

      return matchesQuery && matchesCategory;
    });

    // 按更新時間排序
    filteredPrograms.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return filteredPrograms;
  },

  // 獲取可搜尋的節目（排除未完成首播的節目）
  getSearchablePrograms() {
    return this.programs.filter(program => {
      return !(program.status === this.programStatus.FIRST_AIR && !program.isFirstAirCompleted);
    });
  },

  // 獲取首播節目
  getFirstAirPrograms() {
    return this.programs.filter(program => 
      program.status === this.programStatus.FIRST_AIR && !program.isFirstAirCompleted
    );
  },

  // 獲取節目統計
  getProgramStats() {
    const stats = {
      total: this.programs.length,
      firstAir: this.getFirstAirPrograms().length,
      replay: this.programs.filter(p => p.status === this.programStatus.REPLAY).length,
      special: this.programs.filter(p => p.status === this.programStatus.SPECIAL).length,
      archived: this.programs.filter(p => p.status === this.programStatus.ARCHIVED).length,
      searchable: this.getSearchablePrograms().length,
      byCategory: {}
    };

    // 按分類統計
    this.categories.forEach(category => {
      stats.byCategory[category] = this.programs.filter(p => p.category === category).length;
    });

    return stats;
  },

  // 安排節目到時間槽
  scheduleProgram(programId, airDate, airTime) {
    const program = this.programs.find(p => p.id === programId);
    if (!program) {
      throw new Error('找不到指定的節目');
    }

    // 檢查首播時間限制
    if (program.status === this.programStatus.FIRST_AIR) {
      if (!this.canScheduleFirstAir(airTime)) {
        throw new Error('首播只能在 12:00-18:00 時段安排');
      }
    }

    // 更新播出時間
    program.firstAirDate = airDate;
    program.firstAirTime = airTime;
    program.updatedAt = new Date().toISOString();

    this.savePrograms();
    console.log(`安排節目: ${program.title} 於 ${airDate} ${airTime}`);
    return program;
  },

  // 獲取指定日期的節目安排
  getScheduleForDate(date) {
    const schedule = {};
    
    // 初始化所有時間槽
    this.generateTimeSlots().forEach(slot => {
      schedule[slot.time] = {
        time: slot.time,
        period: slot.period,
        periodName: slot.periodName,
        canFirstAir: slot.canFirstAir,
        program: null,
        isEmpty: true
      };
    });

    // 填充節目資料
    this.programs.forEach(program => {
      if (program.firstAirDate === date && program.firstAirTime) {
        const slot = schedule[program.firstAirTime];
        if (slot) {
          slot.program = program;
          slot.isEmpty = false;
        }
      }
    });

    return schedule;
  },

  // 獲取指定時段的節目
  getProgramsByPeriod(period) {
    return this.programs.filter(program => {
      if (!program.firstAirTime) return false;
      
      const [hour] = program.firstAirTime.split(':').map(Number);
      const periodConfig = this.timeSlots[period];
      
      return hour >= periodConfig.startHour && hour < periodConfig.endHour;
    });
  },

  // 自動更新首播狀態（每分鐘執行一次）
  setupAutoUpdate() {
    setInterval(() => {
      this.updateFirstAirStatus();
    }, 60000); // 每分鐘檢查一次
  },

  // 匯出節目資料
  exportPrograms() {
    return {
      programs: this.programs,
      stats: this.getProgramStats(),
      exportedAt: new Date().toISOString()
    };
  },

  // 匯入節目資料
  importPrograms(data) {
    if (data.programs && Array.isArray(data.programs)) {
      this.programs = data.programs;
      this.savePrograms();
      console.log(`已匯入 ${this.programs.length} 個節目`);
      return true;
    }
    return false;
  },

  // 清理過期節目
  cleanupExpiredPrograms() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const expiredPrograms = this.programs.filter(program => {
      const programDate = new Date(program.firstAirDate);
      return programDate < thirtyDaysAgo && program.status === this.programStatus.REPLAY;
    });

    expiredPrograms.forEach(program => {
      program.status = this.programStatus.ARCHIVED;
      program.updatedAt = new Date().toISOString();
    });

    this.savePrograms();
    console.log(`已歸檔 ${expiredPrograms.length} 個過期節目`);
    return expiredPrograms.length;
  }
};

// 初始化系統
document.addEventListener('DOMContentLoaded', function() {
  window.ProgramManagementSystem.init();
});

console.log('節目管理系統已載入');
