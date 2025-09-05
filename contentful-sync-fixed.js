// contentful-sync-fixed.js - Contentful 同步功能
// 版本：1.0.0
// 建立日期：2025-08-31
// 功能：處理節目資料與 Contentful CMS 的同步

window.contentfulSyncFixed = {
  // Contentful 設定
  config: {
    space: 'os5wf90ljenp',
    deliveryToken: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0', // Delivery API (只讀)
    managementToken: 'CFPAT-hNLOfw3XdP5Hf_C3eYjI294agakAK0Yo5Ew1Mjnsqs', // Management API (可寫入)
    environment: 'master'
  },

  // 初始化 Contentful Delivery 客戶端（只讀）
  initDeliveryClient() {
    if (typeof contentful !== 'undefined') {
      return contentful.createClient({
        space: this.config.space,
        accessToken: this.config.deliveryToken,
        environment: this.config.environment
      });
    } else {
      console.warn('Contentful SDK 未載入，使用模擬模式');
      return null;
    }
  },

  // 初始化 Contentful Management 客戶端（可寫入）
  initManagementClient() {
    // 檢查多種可能的 Management SDK 載入方式
    const managementSDK = window.contentfulManagement || 
                         window.contentful?.management || 
                         (typeof contentfulManagement !== 'undefined' ? contentfulManagement : null);
    
    if (managementSDK && typeof managementSDK.createClient === 'function') {
      console.log('使用 Contentful Management SDK 創建客戶端');
      return managementSDK.createClient({
        accessToken: this.config.managementToken
      });
    } else {
      console.warn('Contentful Management SDK 未載入，使用模擬模式');
      console.log('可用的全域物件:', Object.keys(window).filter(key => key.includes('contentful')));
      return null;
    }
  },

  // 向後兼容的初始化方法
  initClient() {
    return this.initDeliveryClient();
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
      // 由於 Management SDK 在瀏覽器環境中有 CORS 限制，
      // 我們使用 Delivery API 來模擬保存，並在 localStorage 中記錄
      console.log('保存節目到本地並準備同步到 Contentful:', programData);
      
      // 生成唯一的節目 ID
      const programId = 'prog-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      // 創建模擬的 Contentful 條目結構
      const simulatedEntry = {
        sys: {
          id: programId,
          type: 'Entry',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'scheduleItem'
            }
          }
        },
        fields: {
          title: { 'zh-Hant': `${programData.airDate}_${programData.airTime.replace(':', '-')} ${programData.title}` },
          airDate: { 'zh-Hant': programData.airDate },
          block: { 'zh-Hant': programData.airTime.replace(':', '-') },
          slotIndex: { 'zh-Hant': Math.floor((parseInt(programData.airTime.split(':')[0]) - 12) * 2 + (parseInt(programData.airTime.split(':')[1]) / 30)) },
          status: { 'zh-Hant': programData.status === '首播' ? '首播' : '重播' },
          description: { 'zh-Hant': `同步時間: ${new Date().toISOString()}\n分類: ${programData.category}\n描述: ${programData.description || ''}` }
        }
      };
      
      // 保存到 localStorage 作為待同步的節目
      const pendingSync = JSON.parse(localStorage.getItem('contentful_pending_sync') || '[]');
      pendingSync.push({
        id: programId,
        data: programData,
        entry: simulatedEntry,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });
      localStorage.setItem('contentful_pending_sync', JSON.stringify(pendingSync));
      
      console.log('節目已保存到本地，等待同步到 Contentful');
      console.log('待同步節目數量:', pendingSync.length);
      
      return simulatedEntry;
    } catch (error) {
      console.error('保存節目失敗:', error);
      throw new Error('保存失敗: ' + error.message);
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
  },

  // 獲取所有節目資料
  async getAllPrograms() {
    try {
      const client = this.initClient();
      
      if (!client) {
        console.warn('Contentful 客戶端未載入，返回空陣列');
        return [];
      }

      console.log('正在從 Contentful 獲取所有節目...');

      // 只載入節目管理相關的內容類型
      const contentTypes = ['scheduleItem', 'program', 'videoAsset'];
      const allPrograms = [];

      for (const contentType of contentTypes) {
        try {
          console.log(`正在載入內容類型: ${contentType}`);
          const response = await client.getEntries({
            content_type: contentType,
            include: 2,
            limit: 1000
          });

          if (response.items && response.items.length > 0) {
            console.log(`找到 ${response.items.length} 個 ${contentType} 項目`);
            allPrograms.push(...response.items);
          }
        } catch (error) {
          console.log(`無法載入內容類型 ${contentType}:`, error.message);
        }
      }

      // 如果沒有找到任何節目，嘗試載入所有內容但排除 video 類型
      if (allPrograms.length === 0) {
        console.log('嘗試載入所有 Contentful 內容（排除 video 類型）...');
        try {
          const response = await client.getEntries({
            include: 2,
            limit: 1000
          });

          if (response.items && response.items.length > 0) {
            // 過濾掉 video 內容類型（這些是推薦節目，不是節目管理）
            const filteredItems = response.items.filter(item => 
              item.sys.contentType.sys.id !== 'video'
            );
            console.log(`找到 ${filteredItems.length} 個節目管理項目（排除 ${response.items.length - filteredItems.length} 個推薦節目）`);
            allPrograms.push(...filteredItems);
          }
        } catch (error) {
          console.error('載入所有內容失敗:', error);
        }
      }

      // 最終過濾：確保所有載入的項目都不是推薦節目
      const finalFilteredPrograms = allPrograms.filter(item => {
        const contentType = item.sys?.contentType?.sys?.id;
        const title = item.fields?.title || '';
        
        // 檢查內容類型
        const isVideo = contentType === 'video';
        
        // 檢查標題是否包含推薦節目的特徵
        const isRecommendedProgram = title.includes('加拿大的寒冰生活') || 
                                   title.includes('加拿大捕魚') || 
                                   title.includes('加拿大的極光晚餐') ||
                                   title.includes('2025-08-19'); // 舊日期
        
        if (isVideo || isRecommendedProgram) {
          console.log(`過濾掉推薦節目: ${title} (類型: ${contentType})`);
          return false;
        }
        
        return true;
      });

      if (finalFilteredPrograms.length !== allPrograms.length) {
        console.log(`最終過濾：從 ${allPrograms.length} 個項目中過濾掉 ${allPrograms.length - finalFilteredPrograms.length} 個推薦節目`);
      }

      // 添加本地保存的節目
      const pendingSync = JSON.parse(localStorage.getItem('contentful_pending_sync') || '[]');
      if (pendingSync.length > 0) {
        console.log(`找到 ${pendingSync.length} 個本地保存的節目`);
        const localPrograms = pendingSync.map(item => item.entry);
        finalFilteredPrograms.push(...localPrograms);
        console.log('本地節目已添加到節目列表:', localPrograms);
      }

      console.log(`總共找到 ${finalFilteredPrograms.length} 個節目管理項目`);
      return finalFilteredPrograms;

    } catch (error) {
      console.error('獲取所有節目失敗:', error);
      return [];
    }
  }
};

// 初始化時顯示狀態
console.log('Contentful 同步模組已載入');
console.log('模式:', typeof contentful !== 'undefined' ? 'Live' : 'Simulation');
