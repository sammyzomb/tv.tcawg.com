// 簡化的 Contentful Management SDK 載入器
// 解決 Management SDK 載入問題

(function() {
  'use strict';
  
  console.log('🚀 開始載入 Contentful Management SDK...');
  
  // 檢查是否已經載入
  if (typeof contentfulManagement !== 'undefined') {
    console.log('✅ Management SDK 已經載入');
    window.contentfulManagement = contentfulManagement;
    return;
  }
  
  // 載入 Management SDK
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/contentful-management@latest/dist/contentful-management.browser.min.js';
  script.async = false; // 改為同步載入
  
  script.onload = function() {
    console.log('✅ Management SDK 載入成功');
    
    // 確保全域變數可用
    if (typeof contentfulManagement !== 'undefined') {
      window.contentfulManagement = contentfulManagement;
      console.log('✅ Management SDK 已設定為全域變數');
      
      // 觸發載入完成事件
      window.dispatchEvent(new CustomEvent('contentfulManagementLoaded'));
    }
  };
  
  script.onerror = function() {
    console.error('❌ Management SDK 載入失敗，嘗試備用 CDN');
    
    // 嘗試備用 CDN
    const fallbackScript = document.createElement('script');
    fallbackScript.src = 'https://unpkg.com/contentful-management@latest/dist/contentful-management.browser.min.js';
    fallbackScript.async = false;
    
    fallbackScript.onload = function() {
      console.log('✅ Management SDK 備用載入成功');
      if (typeof contentfulManagement !== 'undefined') {
        window.contentfulManagement = contentfulManagement;
        window.dispatchEvent(new CustomEvent('contentfulManagementLoaded'));
      }
    };
    
    fallbackScript.onerror = function() {
      console.error('❌ Management SDK 備用載入也失敗');
      window.dispatchEvent(new CustomEvent('contentfulManagementFailed'));
    };
    
    document.head.appendChild(fallbackScript);
  };
  
  document.head.appendChild(script);
})();
