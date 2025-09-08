// 瀏覽器專用設定檔案範本
// 請複製此檔案為 browser-config.js 並填入真實的 Token

const BROWSER_CONFIG = {
  // Contentful 設定
  CONTENTFUL_SPACE_ID: 'your-space-id-here',
  CONTENTFUL_DELIVERY_TOKEN: 'your-delivery-token-here',
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
  
  // 設定 Contentful 配置物件
  window.CONTENTFUL_CONFIG = {
    SPACE_ID: BROWSER_CONFIG.CONTENTFUL_SPACE_ID,
    DELIVERY_TOKEN: BROWSER_CONFIG.CONTENTFUL_DELIVERY_TOKEN,
    PREVIEW_TOKEN: BROWSER_CONFIG.CONTENTFUL_PREVIEW_TOKEN,
    MANAGEMENT_TOKEN: BROWSER_CONFIG.CONTENTFUL_MANAGEMENT_TOKEN
  };
  
  // 設定全域變數
  window.CONTENTFUL_SPACE_ID = BROWSER_CONFIG.CONTENTFUL_SPACE_ID;
  window.CONTENTFUL_DELIVERY_TOKEN = BROWSER_CONFIG.CONTENTFUL_DELIVERY_TOKEN;
  window.CONTENTFUL_PREVIEW_TOKEN = BROWSER_CONFIG.CONTENTFUL_PREVIEW_TOKEN;
  window.CONTENTFUL_MANAGEMENT_TOKEN = BROWSER_CONFIG.CONTENTFUL_MANAGEMENT_TOKEN;
}

// 導出設定
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BROWSER_CONFIG;
}
