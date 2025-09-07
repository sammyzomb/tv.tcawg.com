// Contentful 真實連線整合系統
// 完全移除模擬模式，確保 100% 與 Contentful 連線

class ContentfulRealOnly {
  constructor() {
    this.config = {
      spaceId: 'os5wf90ljenp',
      environmentId: 'master',
      deliveryToken: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0',
      managementToken: 'CFPAT-hNLOfw3XdP5Hf_C3eYjI8294agakAK0Yo5Ew1Mjnsqs'
    };
    
    this.deliveryClient = null;
    this.managementClient = null;
    this.isInitialized = false;
    this.logs = [];
    this.uploadHistory = [];
    
    // 載入配置
    this.loadConfig();
  }

  // 載入配置
  loadConfig() {
    try {
      const savedConfig = localStorage.getItem('contentful_config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      this.logEntry('config_load_error', 'error', { 
        message: '配置載入失敗',
        error: error.message 
      });
    }
  }

  // 保存配置
  saveConfig() {
    try {
      localStorage.setItem('contentful_config', JSON.stringify(this.config));
      this.logEntry('config_save', 'success', { 
        message: '配置已保存' 
      });
    } catch (error) {
      this.logEntry('config_save_error', 'error', { 
        message: '配置保存失敗',
        error: error.message 
      });
    }
  }

  // 記錄日誌
  async logEntry(type, status, details = {}) {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type: type,
      status: status,
      message: details.message || '',
      details: details,
      connectionInfo: {
        spaceId: this.config.spaceId,
        environmentId: this.config.environmentId,
        hasDeliveryToken: !!this.config.deliveryToken,
        hasManagementToken: !!this.config.managementToken,
        deliveryClientStatus: !!this.deliveryClient,
        managementClientStatus: !!this.managementClient
      }
    };
    
    this.logs.unshift(logEntry);
    
    // 保持最多 1000 條記錄
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }
    
    // 保存到 localStorage
    try {
      localStorage.setItem('contentful_real_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('日誌保存失敗:', error);
    }
    
    console.log(`[${status.toUpperCase()}] ${type}: ${logEntry.message}`, logEntry);
  }

  // 初始化 Contentful 客戶端
  async init() {
    try {
      this.logEntry('init_start', 'info', { 
        message: '開始初始化 Contentful 真實連線系統' 
      });

      // 檢查配置
      if (!this.config.spaceId || !this.config.deliveryToken || !this.config.managementToken) {
        throw new Error('Contentful 配置不完整，請檢查 Space ID、Delivery Token 和 Management Token');
      }

      // 檢查 SDK 載入狀態
      const sdkStatus = this.checkSDKStatus();
      this.logEntry('sdk_check', 'info', { 
        message: '檢查 SDK 載入狀態',
        sdkStatus: sdkStatus
      });

      if (!sdkStatus.contentful) {
        throw new Error('Contentful SDK 未載入');
      }

      // 初始化 Delivery 客戶端
      this.deliveryClient = contentful.createClient({
        space: this.config.spaceId,
        accessToken: this.config.deliveryToken,
        environment: this.config.environmentId
      });
      
      this.logEntry('delivery_client_init', 'success', { 
        message: 'Delivery 客戶端初始化成功',
        spaceId: this.config.spaceId,
        environmentId: this.config.environmentId
      });

      // 初始化 Management 客戶端
      if (sdkStatus.contentfulManagement) {
        this.managementClient = contentfulManagement.createClient({
          accessToken: this.config.managementToken
        });
        
        this.logEntry('management_client_init', 'success', { 
          message: 'Management 客戶端初始化成功' 
        });
      } else {
        // 嘗試修復載入 Management SDK
        this.logEntry('management_client_init', 'warning', { 
          message: 'Management SDK 未載入，嘗試修復載入...' 
        });
        
        if (window.contentfulManagementUltimate) {
          await window.contentfulManagementUltimate.loadManagementSDK();
          
          if (typeof contentfulManagement !== 'undefined') {
            this.managementClient = contentfulManagement.createClient({
              accessToken: this.config.managementToken
            });
            
            this.logEntry('management_client_ultimate_init', 'success', { 
              message: 'Management 客戶端終極載入成功' 
            });
          } else {
            throw new Error('Management SDK 終極載入失敗，無法建立真實連線');
          }
        } else {
          throw new Error('Management SDK 終極載入器不可用，無法建立真實連線');
        }
      }

      // 測試連線
      await this.testConnection();
      
      this.isInitialized = true;
      this.logEntry('init_complete', 'success', { 
        message: 'Contentful 真實連線系統初始化完成',
        hasManagement: !!this.managementClient,
        hasDelivery: !!this.deliveryClient
      });

      return true;
    } catch (error) {
      this.logEntry('init_error', 'error', { 
        message: '初始化失敗',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // 檢查 SDK 載入狀態
  checkSDKStatus() {
    return {
      contentful: typeof contentful !== 'undefined',
      contentfulManagement: typeof contentfulManagement !== 'undefined'
    };
  }

  // 測試連線
  async testConnection() {
    try {
      this.logEntry('connection_test_start', 'info', { 
        message: '開始測試 Contentful 連線' 
      });

      // 測試 Delivery API
      if (this.deliveryClient) {
        const space = await this.deliveryClient.getSpace();
        this.logEntry('delivery_connection_test', 'success', { 
          message: 'Delivery API 連線正常',
          spaceName: space.name,
          spaceId: space.sys.id
        });
      }

      // 測試 Management API
      if (this.managementClient) {
        const space = await this.managementClient.getSpace(this.config.spaceId);
        this.logEntry('management_connection_test', 'success', { 
          message: 'Management API 連線正常',
          spaceName: space.name,
          spaceId: space.sys.id
        });
      }

      this.logEntry('connection_test_complete', 'success', { 
        message: 'Contentful 連線測試完成，所有連線正常' 
      });

      return true;
    } catch (error) {
      this.logEntry('connection_test_error', 'error', { 
        message: '連線測試失敗',
        error: error.message,
        details: error.response?.data || error
      });
      throw error;
    }
  }

  // 上架節目到 Contentful
  async uploadProgram(programData) {
    if (!this.isInitialized) {
      throw new Error('Contentful 系統未初始化，請先初始化');
    }

    if (!this.managementClient) {
      throw new Error('Management 客戶端不可用，無法上架節目');
    }

    try {
      this.logEntry('upload_start', 'info', { 
        message: '開始上架節目到 Contentful',
        programData: programData
      });

      // 步驟 1: 獲取 Space
      this.logEntry('upload_step_1', 'info', { 
        message: '步驟 1: 獲取 Contentful Space',
        spaceId: this.config.spaceId
      });
      
      const space = await this.managementClient.getSpace(this.config.spaceId);
      this.logEntry('upload_step_1_success', 'success', { 
        message: 'Space 獲取成功',
        spaceName: space.name
      });

      // 步驟 2: 獲取 Environment
      this.logEntry('upload_step_2', 'info', { 
        message: '步驟 2: 獲取 Environment',
        environmentId: this.config.environmentId
      });
      
      const environment = await space.getEnvironment(this.config.environmentId);
      this.logEntry('upload_step_2_success', 'success', { 
        message: 'Environment 獲取成功',
        environmentName: environment.name
      });

      // 步驟 3: 獲取 Content Type
      const contentTypeId = programData.contentType || 'scheduleItem';
      this.logEntry('upload_step_3', 'info', { 
        message: '步驟 3: 獲取 Content Type',
        contentTypeId: contentTypeId
      });
      
      const contentType = await environment.getContentType(contentTypeId);
      this.logEntry('upload_step_3_success', 'success', { 
        message: 'Content Type 獲取成功',
        contentTypeName: contentType.name,
        contentTypeId: contentTypeId
      });

      // 步驟 4: 創建 Entry
      const entryData = this.transformProgramData(programData);
      this.logEntry('upload_step_4', 'info', { 
        message: '步驟 4: 創建 Entry',
        contentTypeId: contentTypeId,
        entryData: entryData
      });
      
      const entry = await contentType.createEntry(contentTypeId, {
        fields: entryData
      });
      this.logEntry('upload_step_4_success', 'success', { 
        message: 'Entry 創建成功',
        entryId: entry.sys.id,
        contentTypeId: contentTypeId
      });

      // 步驟 5: 發布 Entry
      this.logEntry('upload_step_5', 'info', { 
        message: '步驟 5: 發布 Entry',
        entryId: entry.sys.id
      });
      
      const publishedEntry = await entry.publish();
      this.logEntry('upload_step_5_success', 'success', { 
        message: 'Entry 發布成功',
        entryId: publishedEntry.sys.id,
        publishedAt: publishedEntry.sys.publishedAt
      });

      // 記錄上架歷史
      const uploadRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        programData: programData,
        entryId: publishedEntry.sys.id,
        status: 'success',
        connectionInfo: {
          spaceId: this.config.spaceId,
          environmentId: this.config.environmentId,
          contentTypeId: 'scheduleItem'
        }
      };
      
      this.uploadHistory.unshift(uploadRecord);
      
      // 保持最多 100 條記錄
      if (this.uploadHistory.length > 100) {
        this.uploadHistory = this.uploadHistory.slice(0, 100);
      }
      
      // 保存到 localStorage
      try {
        localStorage.setItem('contentful_upload_history', JSON.stringify(this.uploadHistory));
      } catch (error) {
        console.error('上架記錄保存失敗:', error);
      }

      this.logEntry('upload_complete', 'success', { 
        message: '節目上架完成',
        entryId: publishedEntry.sys.id,
        uploadRecord: uploadRecord
      });

      return {
        success: true,
        entryId: publishedEntry.sys.id,
        publishedAt: publishedEntry.sys.publishedAt,
        uploadRecord: uploadRecord
      };

    } catch (error) {
      this.logEntry('upload_error', 'error', { 
        message: '節目上架失敗',
        error: error.message,
        details: error.response?.data || error,
        programData: programData
      });
      
      // 記錄失敗的上架嘗試
      const failedRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        programData: programData,
        status: 'failed',
        error: error.message,
        connectionInfo: {
          spaceId: this.config.spaceId,
          environmentId: this.config.environmentId,
          contentTypeId: 'scheduleItem'
        }
      };
      
      this.uploadHistory.unshift(failedRecord);
      
      try {
        localStorage.setItem('contentful_upload_history', JSON.stringify(this.uploadHistory));
      } catch (saveError) {
        console.error('失敗記錄保存失敗:', saveError);
      }
      
      throw error;
    }
  }

  // 轉換節目數據格式 - 根據實際 Contentful 內容模型
  transformProgramData(programData) {
    // 根據內容類型決定轉換方式
    if (programData.contentType === 'video') {
      return this.transformVideoData(programData);
    } else {
      return this.transformScheduleItemData(programData);
    }
  }

  // 轉換影片數據格式
  transformVideoData(programData) {
    return {
      '影片標題': {
        'zh-TW': programData.title || '未命名影片'
      },
      '影片類型': {
        'zh-TW': programData.videoType || 'YouTube'
      },
      'YouTube ID': {
        'zh-TW': programData.youtubeId || ''
      },
      'MP4 影片網址': {
        'zh-TW': programData.mp4File || ''
      },
      '首頁 HERO': {
        'zh-TW': programData.isHero || false
      },
      'HERO主題': {
        'zh-TW': programData.heroTheme || ''
      },
      'HERO右下說明文字': {
        'zh-TW': programData.heroDescription || ''
      },
      '精選節目推薦': {
        'zh-TW': programData.isFeatured || false
      },
      '精選推薦影片說明文字': {
        'zh-TW': programData.featuredDescription || ''
      },
      '即將播出': {
        'zh-TW': programData.isUpcoming || false
      },
      '上線時間': {
        'zh-TW': programData.airDate || new Date().toISOString()
      },
      '標籤': {
        'zh-TW': programData.tags || []
      },
      '簡短描述': {
        'zh-TW': programData.description || ''
      }
    };
  }

  // 轉換排表項目數據格式
  transformScheduleItemData(programData) {
    return {
      '顯示名稱': {
        'zh-TW': programData.title || '未命名節目'
      },
      '播出日期': {
        'zh-TW': programData.airDate || new Date().toISOString()
      },
      '時段': {
        'zh-TW': programData.airTime || '14:00'
      },
      '槽位序號 (0-11)': {
        'zh-TW': programData.slotNumber || 0
      },
      '是否首播': {
        'zh-TW': programData.isFirstBroadcast || true
      },
      '備註': {
        'zh-TW': programData.notes || ''
      }
    };
  }

  // 獲取上架歷史
  getUploadHistory() {
    return this.uploadHistory;
  }

  // 清除上架歷史
  clearUploadHistory() {
    this.uploadHistory = [];
    localStorage.removeItem('contentful_upload_history');
    this.logEntry('upload_history_cleared', 'info', { 
      message: '上架歷史已清除' 
    });
  }

  // 獲取所有日誌
  getAllLogs() {
    return this.logs;
  }

  // 清除所有日誌
  clearAllLogs() {
    this.logs = [];
    localStorage.removeItem('contentful_real_logs');
    this.logEntry('logs_cleared', 'info', { 
      message: '所有日誌已清除' 
    });
  }

  // 更新配置
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    this.logEntry('config_updated', 'info', { 
      message: '配置已更新',
      newConfig: newConfig
    });
  }

  // 獲取配置
  getConfig() {
    return this.config;
  }
}

// 創建全域實例
window.contentfulRealOnly = new ContentfulRealOnly();

// 自動初始化
window.addEventListener('load', async function() {
  console.log('🚀 開始自動初始化 Contentful 真實連線系統...');
  try {
    await window.contentfulRealOnly.init();
    console.log('✅ Contentful 真實連線系統初始化成功');
  } catch (error) {
    console.error('❌ Contentful 真實連線系統初始化失敗:', error);
  }
});
