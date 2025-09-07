// Contentful 快速檢查腳本
// 檢查所有 API 和 Token 是否正確配置

class ContentfulQuickCheck {
  constructor() {
    this.config = {
      spaceId: 'os5wf90ljenp',
      environmentId: 'master',
      deliveryToken: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0',
      managementToken: 'CFPAT-hNLOfw3XdP5Hf_C3eYjI8294agakAK0Yo5Ew1Mjnsqs'
    };
    
    this.results = {
      config: false,
      deliveryAPI: false,
      managementAPI: false,
      sdk: false,
      overall: false
    };
  }

  // 檢查配置
  checkConfig() {
    console.log('🔍 檢查 Contentful 配置...');
    
    const required = ['spaceId', 'deliveryToken', 'managementToken'];
    const missing = required.filter(key => !this.config[key] || this.config[key].includes('YOUR_'));
    
    if (missing.length === 0) {
      console.log('✅ 配置檢查通過');
      console.log('📋 配置詳情:');
      console.log('  - Space ID:', this.config.spaceId);
      console.log('  - Environment ID:', this.config.environmentId);
      console.log('  - Delivery Token:', this.config.deliveryToken.substring(0, 10) + '...');
      console.log('  - Management Token:', this.config.managementToken.substring(0, 15) + '...');
      this.results.config = true;
      return true;
    } else {
      console.error('❌ 配置檢查失敗');
      console.error('缺少配置項目:', missing);
      this.results.config = false;
      return false;
    }
  }

  // 檢查 SDK 載入
  checkSDK() {
    console.log('🔍 檢查 Contentful SDK 載入狀態...');
    
    const sdkStatus = {
      contentful: typeof contentful !== 'undefined',
      contentfulManagement: typeof contentfulManagement !== 'undefined'
    };
    
    console.log('📦 SDK 狀態:');
    console.log('  - Contentful SDK:', sdkStatus.contentful ? '✅ 已載入' : '❌ 未載入');
    console.log('  - Management SDK:', sdkStatus.contentfulManagement ? '✅ 已載入' : '❌ 未載入');
    
    if (sdkStatus.contentful) {
      this.results.sdk = true;
      return true;
    } else {
      this.results.sdk = false;
      return false;
    }
  }

  // 檢查 Delivery API
  async checkDeliveryAPI() {
    console.log('🔍 檢查 Delivery API...');
    
    try {
      if (!this.results.sdk) {
        throw new Error('Contentful SDK 未載入');
      }

      const client = contentful.createClient({
        space: this.config.spaceId,
        accessToken: this.config.deliveryToken,
        environment: this.config.environmentId
      });

      const space = await client.getSpace();
      const entries = await client.getEntries({ limit: 1 });

      console.log('✅ Delivery API 檢查通過');
      console.log('📋 API 詳情:');
      console.log('  - Space Name:', space.name);
      console.log('  - Space ID:', space.sys.id);
      console.log('  - Total Entries:', entries.total);
      
      this.results.deliveryAPI = true;
      return true;
    } catch (error) {
      console.error('❌ Delivery API 檢查失敗');
      console.error('錯誤詳情:', error.message);
      this.results.deliveryAPI = false;
      return false;
    }
  }

  // 檢查 Management API
  async checkManagementAPI() {
    console.log('🔍 檢查 Management API...');
    
    try {
      if (!this.results.sdk) {
        throw new Error('Contentful SDK 未載入');
      }

      if (typeof contentfulManagement === 'undefined') {
        throw new Error('Management SDK 未載入');
      }

      const client = contentfulManagement.createClient({
        accessToken: this.config.managementToken
      });

      const space = await client.getSpace(this.config.spaceId);
      const environment = await space.getEnvironment(this.config.environmentId);
      const contentTypes = await environment.getContentTypes();

      console.log('✅ Management API 檢查通過');
      console.log('📋 API 詳情:');
      console.log('  - Space Name:', space.name);
      console.log('  - Environment Name:', environment.name);
      console.log('  - Content Types:', contentTypes.items.length);
      
      this.results.managementAPI = true;
      return true;
    } catch (error) {
      console.error('❌ Management API 檢查失敗');
      console.error('錯誤詳情:', error.message);
      this.results.managementAPI = false;
      return false;
    }
  }

  // 執行完整檢查
  async runFullCheck() {
    console.log('🚀 開始 Contentful 完整檢查...');
    console.log('='.repeat(50));
    
    // 檢查配置
    this.checkConfig();
    console.log('');
    
    // 檢查 SDK
    this.checkSDK();
    console.log('');
    
    // 檢查 Delivery API
    await this.checkDeliveryAPI();
    console.log('');
    
    // 檢查 Management API
    await this.checkManagementAPI();
    console.log('');
    
    // 總結
    this.results.overall = this.results.config && this.results.sdk && this.results.deliveryAPI && this.results.managementAPI;
    
    console.log('='.repeat(50));
    console.log('📊 檢查結果總結:');
    console.log('  - 配置檢查:', this.results.config ? '✅ 通過' : '❌ 失敗');
    console.log('  - SDK 檢查:', this.results.sdk ? '✅ 通過' : '❌ 失敗');
    console.log('  - Delivery API:', this.results.deliveryAPI ? '✅ 通過' : '❌ 失敗');
    console.log('  - Management API:', this.results.managementAPI ? '✅ 通過' : '❌ 失敗');
    console.log('  - 整體狀態:', this.results.overall ? '✅ 全部通過' : '❌ 有問題');
    
    if (this.results.overall) {
      console.log('🎉 所有檢查都通過！Contentful 配置正確，可以正常使用。');
    } else {
      console.log('⚠️ 部分檢查失敗，請檢查上述錯誤訊息並修復問題。');
    }
    
    return this.results;
  }

  // 獲取檢查結果
  getResults() {
    return this.results;
  }

  // 獲取配置
  getConfig() {
    return this.config;
  }
}

// 創建全域實例
window.contentfulQuickCheck = new ContentfulQuickCheck();

// 自動執行檢查（如果 SDK 已載入）
if (typeof contentful !== 'undefined') {
  console.log('🔍 自動執行 Contentful 快速檢查...');
  window.contentfulQuickCheck.runFullCheck();
} else {
  console.log('⏳ 等待 Contentful SDK 載入後執行檢查...');
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof contentful !== 'undefined') {
        window.contentfulQuickCheck.runFullCheck();
      } else {
        console.log('❌ Contentful SDK 載入失敗，無法執行檢查');
      }
    }, 2000);
  });
}
