// 瀏覽器專用設定檔案
// 注意：這個檔案包含敏感資訊，僅用於開發測試
// 生產環境應該使用環境變數或後端 API

const BROWSER_CONFIG = {
  // Contentful 設定
  CONTENTFUL_SPACE_ID: 'os5wf90ljenp',
  CONTENTFUL_DELIVERY_TOKEN: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0',
  CONTENTFUL_PREVIEW_TOKEN: 'your-preview-token-here',
  CONTENTFUL_MANAGEMENT_TOKEN: 'your-management-token-here',
  
  // 管理員設定
  SUPER_ADMIN_EMAIL: 'your-admin-email@example.com',
  SUPER_ADMIN_PASSWORD: 'your-admin-password-here',
  
  // 網站設定
  SITE_URL: 'https://tv.tcawg.com',
  SITE_NAME: '旅遊電視台網站',
  ENVIRONMENT: 'development'
};

// 提供環境變數相容性
if (typeof window !== 'undefined') {
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  
  // 設定環境變數
  Object.keys(BROWSER_CONFIG).forEach(key => {
    window.process.env[key] = BROWSER_CONFIG[key];
  });
}

// 導出設定
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BROWSER_CONFIG;
}
