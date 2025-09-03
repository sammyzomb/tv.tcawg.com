// admin-login-audit.js - 管理員登入審計和日誌記錄系統
class LoginAuditSystem {
  constructor() {
    this.logs = JSON.parse(localStorage.getItem('loginAuditLogs') || '[]');
    this.blockedIPs = JSON.parse(localStorage.getItem('blockedIPs') || '[]');
    this.maxAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15分鐘
    this.maxLogs = 1000; // 最多保留1000條記錄
  }

  // 記錄登入嘗試
  async logLoginAttempt(email, password, ipAddress, userAgent, success, reason = '') {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      email: email,
      password: this.maskPassword(password), // 遮罩密碼
      ipAddress: ipAddress,
      userAgent: userAgent,
      success: success,
      reason: reason,
      sessionId: this.generateSessionId()
    };

    this.logs.unshift(logEntry);
    
    // 限制日誌數量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // 儲存到 localStorage
    localStorage.setItem('loginAuditLogs', JSON.stringify(this.logs));

    // 如果登入失敗，檢查是否需要封鎖 IP
    if (!success) {
      await this.checkAndBlockIP(ipAddress, email);
    }

    // 記錄到 Contentful（如果可用）
    await this.logToContentful(logEntry);

    return logEntry;
  }

  // 遮罩密碼（只顯示前後各1個字符）
  maskPassword(password) {
    if (!password || password.length <= 2) {
      return '*'.repeat(password.length);
    }
    return password.charAt(0) + '*'.repeat(password.length - 2) + password.charAt(password.length - 1);
  }

  // 生成日誌 ID
  generateLogId() {
    return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 生成會話 ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 檢查並封鎖 IP
  async checkAndBlockIP(ipAddress, email) {
    const attempts = this.getRecentAttempts(ipAddress, 15 * 60 * 1000); // 15分鐘內
    const failedAttempts = attempts.filter(attempt => !attempt.success);

    if (failedAttempts.length >= this.maxAttempts) {
      const blockEntry = {
        ipAddress: ipAddress,
        email: email,
        blockedAt: new Date().toISOString(),
        reason: 'Too many failed login attempts',
        attempts: failedAttempts.length
      };

      this.blockedIPs.push(blockEntry);
      localStorage.setItem('blockedIPs', JSON.stringify(this.blockedIPs));

      console.log(`IP ${ipAddress} 已被封鎖，原因：登入失敗次數過多`);
    }
  }

  // 檢查 IP 是否被封鎖
  isIPBlocked(ipAddress) {
    const now = new Date().getTime();
    const blockEntry = this.blockedIPs.find(block => 
      block.ipAddress === ipAddress && 
      (now - new Date(block.blockedAt).getTime()) < this.lockoutDuration
    );

    return blockEntry;
  }

  // 解除 IP 封鎖（超級管理員功能）
  unblockIP(ipAddress, adminEmail) {
    const index = this.blockedIPs.findIndex(block => block.ipAddress === ipAddress);
    if (index !== -1) {
      const unblockLog = {
        timestamp: new Date().toISOString(),
        action: 'unblock_ip',
        ipAddress: ipAddress,
        adminEmail: adminEmail,
        reason: 'Manually unblocked by super admin'
      };

      this.blockedIPs.splice(index, 1);
      localStorage.setItem('blockedIPs', JSON.stringify(this.blockedIPs));
      
      // 記錄解除封鎖操作
      this.logs.unshift(unblockLog);
      localStorage.setItem('loginAuditLogs', JSON.stringify(this.logs));

      return true;
    }
    return false;
  }

  // 獲取最近的登入嘗試
  getRecentAttempts(ipAddress, timeWindow) {
    const now = new Date().getTime();
    return this.logs.filter(log => 
      log.ipAddress === ipAddress && 
      (now - new Date(log.timestamp).getTime()) < timeWindow
    );
  }

  // 獲取所有日誌
  getAllLogs(limit = 100) {
    return this.logs.slice(0, limit);
  }

  // 搜尋日誌
  searchLogs(criteria) {
    return this.logs.filter(log => {
      if (criteria.email && !log.email.includes(criteria.email)) return false;
      if (criteria.ipAddress && !log.ipAddress.includes(criteria.ipAddress)) return false;
      if (criteria.success !== undefined && log.success !== criteria.success) return false;
      if (criteria.dateFrom && new Date(log.timestamp) < new Date(criteria.dateFrom)) return false;
      if (criteria.dateTo && new Date(log.timestamp) > new Date(criteria.dateTo)) return false;
      return true;
    });
  }

  // 獲取統計資訊
  getStatistics() {
    const totalAttempts = this.logs.length;
    const successfulLogins = this.logs.filter(log => log.success).length;
    const failedLogins = totalAttempts - successfulLogins;
    const blockedIPsCount = this.blockedIPs.length;

    // 計算成功率
    const successRate = totalAttempts > 0 ? (successfulLogins / totalAttempts * 100).toFixed(2) : 0;

    // 獲取最常見的失敗 IP
    const failedIPs = this.logs
      .filter(log => !log.success)
      .reduce((acc, log) => {
        acc[log.ipAddress] = (acc[log.ipAddress] || 0) + 1;
        return acc;
      }, {});

    const topFailedIPs = Object.entries(failedIPs)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([ip, count]) => ({ ip, count }));

    return {
      totalAttempts,
      successfulLogins,
      failedLogins,
      successRate,
      blockedIPsCount,
      topFailedIPs
    };
  }

  // 匯出日誌為 CSV
  exportLogsToCSV() {
    const headers = ['時間', '電子郵件', '密碼', 'IP地址', '用戶代理', '成功', '原因', '會話ID'];
    const csvContent = [
      headers.join(','),
      ...this.logs.map(log => [
        log.timestamp,
        log.email,
        log.password,
        log.ipAddress,
        `"${log.userAgent}"`,
        log.success ? '是' : '否',
        log.reason,
        log.sessionId
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  // 清理舊日誌
  cleanupOldLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const originalCount = this.logs.length;
    this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoffDate);
    
    localStorage.setItem('loginAuditLogs', JSON.stringify(this.logs));
    
    return {
      originalCount,
      newCount: this.logs.length,
      removedCount: originalCount - this.logs.length
    };
  }

  // 記錄到 Contentful（如果可用）
  async logToContentful(logEntry) {
    try {
      if (typeof contentful !== 'undefined' && window.contentfulClient) {
        const client = window.contentfulClient;
        
        // 建立登入日誌條目
        const entry = {
          fields: {
            title: {
              'zh-TW': `登入嘗試 - ${logEntry.success ? '成功' : '失敗'}`
            },
            email: {
              'zh-TW': logEntry.email
            },
            ipAddress: {
              'zh-TW': logEntry.ipAddress
            },
            success: {
              'zh-TW': logEntry.success
            },
            reason: {
              'zh-TW': logEntry.reason || ''
            },
            timestamp: {
              'zh-TW': logEntry.timestamp
            },
            userAgent: {
              'zh-TW': logEntry.userAgent
            }
          }
        };

        // 這裡需要 Management API 來創建條目
        // 由於瀏覽器端限制，我們只記錄到本地
        console.log('登入日誌已記錄到本地儲存');
      }
    } catch (error) {
      console.error('記錄到 Contentful 失敗:', error);
    }
  }

  // 獲取用戶的 IP 地址
  async getClientIP() {
    try {
      // 嘗試從多個服務獲取 IP
      const responses = await Promise.allSettled([
        fetch('https://api.ipify.org?format=json'),
        fetch('https://ipapi.co/json/'),
        fetch('https://api.myip.com')
      ]);

      for (const response of responses) {
        if (response.status === 'fulfilled' && response.value.ok) {
          const data = await response.value.json();
          return data.ip || data.query || data.ipAddress;
        }
      }

      // 如果都失敗，返回本地 IP
      return '127.0.0.1';
    } catch (error) {
      console.error('獲取 IP 地址失敗:', error);
      return '127.0.0.1';
    }
  }

  // 獲取用戶代理
  getUserAgent() {
    return navigator.userAgent || 'Unknown';
  }
}

// 全域實例
window.loginAuditSystem = new LoginAuditSystem();

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoginAuditSystem;
}
