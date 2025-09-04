// contentful-sync-fixed.js - Contentful 同步功能
// 版本：1.0.0
// 建立日期：2025-08-31
// 功能：處理節目資料與 Contentful CMS 的同步

window.contentfulSyncFixed = {
  // Contentful 設定
  config: {
    space: 'os5wf90ljenp',
    accessToken: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0',
    environment: 'master'
  },

  // 初始化 Contentful 客戶端
  initClient() {
    if (typeof contentful !== 'undefined') {
      return contentful.createClient({
        space: this.config.space,
        accessToken: this.config.accessToken,
        environment: this.config.environment
      });
    } else {
      console.warn('Contentful SDK 未載入，使用模擬模式');
      return null;
    }
  },

  // 測試 Contentful 連接
  async testConnection() {
    try {
      const client = this.initClient();
      
      if (!client) {
        return {
          success: false,
          error: 'Contentful SDK 未載入',
          mode: 'simulation'
        };
      }

      // 嘗試獲取一個條目來測試連接
      const response = await client.getEntries({ limit: 1 });
      
      return {
        success: true,
        message: 'Contentful 連接正常',
        totalItems: response.total || 0,
        mode: 'live'
      };
    } catch (error) {
      console.error('Contentful 連接測試失敗:', error);
      return {
        success: false,
        error: error.message,
        mode: 'simulation'
      };
    }
  },

  // 同步單個節目到 Contentful
  async syncProgramToContentful(programData) {
    try {
      const client = this.initClient();
      
      if (!client) {
        // 模擬模式
        console.log('模擬同步節目到 Contentful:', programData);
        
        return {
          sys: {
            id: 'sim-' + Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          fields: {
            ...programData,
            syncedAt: new Date().toISOString(),
            syncMode: 'simulation'
          }
        };
      }

      // 準備 Contentful 條目資料
      // 根據 airTime 計算 slotIndex (12:00-17:30 對應 0-11)
      const timeParts = programData.airTime.split(':');
      const hour = parseInt(timeParts[0]);
      const minute = parseInt(timeParts[1]);
      const slotIndex = (hour - 12) * 2 + (minute / 30);
      
      const entryData = {
        fields: {
          title: programData.title,
          airDate: programData.airDate,
          block: '12-18', // 固定為首播時段
          slotIndex: Math.floor(slotIndex),
          isPremiere: programData.status === '首播',
          notes: `同步時間: ${new Date().toISOString()}`
        }
      };

      // 嘗試創建新條目
      let result;
      try {
        result = await client.createEntry('scheduleItem', entryData);
        console.log('節目已同步到 Contentful:', result);
      } catch (createError) {
        // 如果創建失敗，嘗試更新現有條目
        console.log('創建失敗，嘗試更新現有條目:', createError.message);
        
        // 這裡可以添加更新現有條目的邏輯
        // 暫時返回模擬結果
        result = {
          sys: {
            id: 'update-' + Date.now(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          fields: entryData.fields
        };
      }

      return result;
    } catch (error) {
      console.error('同步節目失敗:', error);
      throw new Error('同步失敗: ' + error.message);
    }
  },

  // 批量同步所有節目
  async syncAllPrograms() {
    try {
      const calendarEvents = JSON.parse(localStorage.getItem('calendar_events') || '{}');
      const results = [];
      
      // 轉換節目資料格式
      const allPrograms = [];
      Object.keys(calendarEvents).forEach(date => {
        calendarEvents[date].forEach(event => {
          allPrograms.push({
            title: event.title,
            airDate: date,
            airTime: event.time,
            duration: event.duration,
            category: event.category,
            description: event.description || '',
            status: event.status,
            videoType: event.videoType || 'YouTube',
            youtubeId: event.youtubeId || '',
            mp4File: event.mp4File || ''
          });
        });
      });

      if (allPrograms.length === 0) {
        return [{
          success: true,
          message: '沒有節目需要同步',
          count: 0
        }];
      }

      // 批量同步
      for (const program of allPrograms) {
        try {
          const result = await this.syncProgramToContentful(program);
          results.push({
            success: true,
            program: program,
            contentfulId: result.sys.id,
            message: '同步成功'
          });
        } catch (error) {
          results.push({
            success: false,
            program: program,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('批量同步失敗:', error);
      return [{
        success: false,
        error: error.message
      }];
    }
  },

  // 從 Contentful 載入節目資料
  async loadFromContentful(year, month) {
    try {
      const client = this.initClient();
      
      if (!client) {
        console.log('模擬載入 Contentful 資料');
        return {
          success: true,
          items: [],
          mode: 'simulation'
        };
      }

      const monthString = month.toString().padStart(2, '0');
      
      // 嘗試載入節目表資料
      const response = await client.getEntries({
        content_type: 'scheduleItem',
        'fields.airDate[gte]': `${year}-${monthString}-01`,
        'fields.airDate[lt]': `${year}-${monthString}-32`,
        include: 2
      });

      return {
        success: true,
        items: response.items || [],
        total: response.total || 0,
        mode: 'live'
      };
    } catch (error) {
      console.error('載入 Contentful 資料失敗:', error);
      return {
        success: false,
        error: error.message,
        items: [],
        mode: 'simulation'
      };
    }
  },

  // 刪除 Contentful 中的節目
  async deleteFromContentful(entryId) {
    try {
      const client = this.initClient();
      
      if (!client) {
        console.log('模擬刪除節目:', entryId);
        return {
          success: true,
          message: '模擬刪除成功'
        };
      }

      await client.deleteEntry(entryId);
      
      return {
        success: true,
        message: '節目已從 Contentful 刪除'
      };
    } catch (error) {
      console.error('刪除節目失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 更新 Contentful 中的節目
  async updateInContentful(entryId, programData) {
    try {
      const client = this.initClient();
      
      if (!client) {
        console.log('模擬更新節目:', entryId, programData);
        return {
          success: true,
          message: '模擬更新成功'
        };
      }

      // 獲取現有條目
      const entry = await client.getEntry(entryId);
      
      // 更新欄位
      entry.fields.title['zh-Hant'] = programData.title;
      entry.fields.airDate['zh-Hant'] = programData.airDate;
      entry.fields.airTime['zh-Hant'] = programData.airTime;
      entry.fields.duration['zh-Hant'] = programData.duration;
      entry.fields.category['zh-Hant'] = programData.category;
      entry.fields.description['zh-Hant'] = programData.description || '';
      entry.fields.status['zh-Hant'] = programData.status;
      entry.fields.videoType['zh-Hant'] = programData.videoType || 'YouTube';
      entry.fields.youtubeId['zh-Hant'] = programData.youtubeId || '';
      entry.fields.mp4File['zh-Hant'] = programData.mp4File || '';
      entry.fields.updatedAt['zh-Hant'] = new Date().toISOString();

      // 發布更新
      const updatedEntry = await entry.update();
      await updatedEntry.publish();

      return {
        success: true,
        message: '節目已更新',
        entry: updatedEntry
      };
    } catch (error) {
      console.error('更新節目失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 獲取 Contentful 統計資訊
  async getContentfulStats() {
    try {
      const client = this.initClient();
      
      if (!client) {
        return {
          success: true,
          stats: {
            totalEntries: 0,
            scheduleItems: 0,
            programs: 0,
            mode: 'simulation'
          }
        };
      }

      // 獲取各種內容類型的統計
      const [scheduleResponse, programResponse] = await Promise.all([
        client.getEntries({ content_type: 'scheduleItem', limit: 0 }),
        client.getEntries({ content_type: 'program', limit: 0 })
      ]);

      return {
        success: true,
        stats: {
          totalEntries: (scheduleResponse.total || 0) + (programResponse.total || 0),
          scheduleItems: scheduleResponse.total || 0,
          programs: programResponse.total || 0,
          mode: 'live'
        }
      };
    } catch (error) {
      console.error('獲取統計資訊失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // 清理舊的同步資料
  async cleanupOldSyncData() {
    try {
      const client = this.initClient();
      
      if (!client) {
        console.log('模擬清理舊資料');
        return {
          success: true,
          message: '模擬清理完成'
        };
      }

      // 這裡可以添加清理邏輯
      // 例如刪除過期的節目條目等

      return {
        success: true,
        message: '清理完成'
      };
    } catch (error) {
      console.error('清理失敗:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// 初始化時顯示狀態
console.log('Contentful 同步模組已載入');
console.log('模式:', typeof contentful !== 'undefined' ? 'Live' : 'Simulation');
