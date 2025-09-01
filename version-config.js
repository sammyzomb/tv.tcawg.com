// 版本配置文件
// 統一管理所有頁面的版本資訊

const VERSION_CONFIG = {
  // 當前版本資訊
  current: {
    version: 'v1.1.0',
    releaseDate: '2024/12/31',
    releaseTime: '22:30:00',
    fullVersion: 'v1.1.0 (2024/12/31 22:30:00)',
    description: '後台管理系統增強版'
  },
  
  // 版本歷史
  history: [
    {
      version: 'v1.1.0',
      date: '2024/12/31',
      time: '22:30:00',
      description: '後台管理系統增強版',
      features: [
        '超級管理員創建系統',
        '增強版節目上傳功能',
        '統一的 Contentful API 管理',
        '版本管理系統',
        '管理員除錯系統'
      ]
    },
    {
      version: 'v1.0.0',
      date: '2024/12/31',
      time: '21:00:00',
      description: '基礎網站版',
      features: [
        '基礎旅遊電視台網站',
        '節目播放功能',
        '節目表顯示',
        '響應式設計',
        '環境變數安全設定'
      ]
    }
  ],
  
  // 獲取當前版本資訊
  getCurrentVersion() {
    return this.current;
  },
  
  // 獲取完整版本字串
  getFullVersionString() {
    return `${this.current.version} (${this.current.releaseDate} ${this.current.releaseTime})`;
  },
  
  // 獲取版本歷史
  getVersionHistory() {
    return this.history;
  },
  
  // 檢查是否為最新版本
  isLatestVersion(version) {
    return version === this.current.version;
  },
  
  // 格式化版本顯示
  formatVersionDisplay() {
    return `<span style="color: #2b71d2; font-weight: 600;">${this.current.version}</span>`;
  },
  
  // 格式化完整版本顯示
  formatFullVersionDisplay() {
    return `<span style="color: #2b71d2; font-weight: 600;">${this.getFullVersionString()}</span>`;
  }
};

// 如果是在瀏覽器環境中，將配置添加到全域
if (typeof window !== 'undefined') {
  window.VERSION_CONFIG = VERSION_CONFIG;
}

// 如果是在 Node.js 環境中，導出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VERSION_CONFIG;
}
