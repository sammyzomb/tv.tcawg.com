/**
 * 管理員帳號管理服務
 * 使用 GitHub 作為資料庫，實現跨設備同步
 */

class AdminAccountsService {
  constructor() {
    this.accountsData = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5分鐘快取
    this.accountsUrl = 'https://raw.githubusercontent.com/sammyzomb/tv.tcawg.com/main/admin-accounts.json';
  }

  /**
   * 從 GitHub 獲取帳號資料
   */
  async fetchAccountsData() {
    try {
      // 檢查快取是否有效
      if (this.accountsData && this.lastFetch && 
          (Date.now() - this.lastFetch) < this.cacheTimeout) {
        console.log('使用快取的帳號資料');
        return this.accountsData;
      }

      console.log('從 GitHub 獲取最新帳號資料...');
      
      // 從 GitHub 獲取資料
      const response = await fetch(this.accountsUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 驗證資料格式
      if (!this.validateAccountsData(data)) {
        throw new Error('帳號資料格式無效');
      }

      // 更新快取
      this.accountsData = data;
      this.lastFetch = Date.now();
      
      console.log('帳號資料更新成功');
      return data;

    } catch (error) {
      console.error('獲取帳號資料失敗:', error);
      
      // 如果 GitHub 獲取失敗，嘗試使用本地備份
      return this.getLocalBackup();
    }
  }

  /**
   * 驗證帳號資料格式
   */
  validateAccountsData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.accounts)) return false;
    if (!data.settings || typeof data.settings !== 'object') return false;
    
    // 驗證每個帳號
    for (const account of data.accounts) {
      if (!account.id || !account.email || !account.name || !account.role) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 獲取本地備份資料
   */
  getLocalBackup() {
    console.log('使用本地備份帳號資料');
    
    // 從 localStorage 獲取備份
    const backup = localStorage.getItem('admin_accounts_backup');
    if (backup) {
      try {
        return JSON.parse(backup);
      } catch (e) {
        console.error('本地備份資料損壞:', e);
      }
    }

    // 返回預設資料
    return {
      last_updated: new Date().toISOString(),
      version: "1.0",
      accounts: [
        {
          id: "super_admin_001",
          email: "sammyzomb@gmail.com",
          name: "超級管理員",
          role: "super_admin",
          permissions: ["read", "write", "delete", "publish", "admin", "system"],
          status: "active",
          created_at: "2025-01-01T00:00:00Z",
          last_login: null,
          password_hash: "Ddpeacemisb@"
        }
      ],
      settings: {
        max_login_attempts: 5,
        lockout_duration_minutes: 15,
        session_timeout_hours: 8,
        password_policy: {
          min_length: 8,
          require_uppercase: true,
          require_lowercase: true,
          require_numbers: true,
          require_special_chars: true
        }
      }
    };
  }

  /**
   * 驗證用戶登入
   */
  async authenticateUser(email, password) {
    try {
      const accountsData = await this.fetchAccountsData();
      const account = accountsData.accounts.find(acc => 
        acc.email === email && acc.status === 'active'
      );

      if (!account) {
        console.log('找不到帳號或帳號已停用');
        return null;
      }

      // 檢查密碼（實際應用中應該使用加密密碼）
      if (account.password_hash === password) {
        // 更新最後登入時間
        await this.updateLastLogin(account.id);
        
        return {
          id: account.id,
          email: account.email,
          name: account.name,
          role: account.role,
          permissions: account.permissions
        };
      }

      console.log('密碼錯誤');
      return null;

    } catch (error) {
      console.error('驗證用戶失敗:', error);
      return null;
    }
  }

  /**
   * 更新最後登入時間
   */
  async updateLastLogin(accountId) {
    try {
      // 更新本地快取
      if (this.accountsData) {
        const account = this.accountsData.accounts.find(acc => acc.id === accountId);
        if (account) {
          account.last_login = new Date().toISOString();
        }
      }

      // 更新本地備份
      if (this.accountsData) {
        localStorage.setItem('admin_accounts_backup', JSON.stringify(this.accountsData));
      }

    } catch (error) {
      console.error('更新最後登入時間失敗:', error);
    }
  }

  /**
   * 獲取所有帳號列表
   */
  async getAllAccounts() {
    try {
      const accountsData = await this.fetchAccountsData();
      return accountsData.accounts.map(account => ({
        id: account.id,
        email: account.email,
        name: account.name,
        role: account.role,
        status: account.status,
        created_at: account.created_at,
        last_login: account.last_login
      }));
    } catch (error) {
      console.error('獲取帳號列表失敗:', error);
      return [];
    }
  }

  /**
   * 獲取帳號設定
   */
  async getSettings() {
    try {
      const accountsData = await this.fetchAccountsData();
      return accountsData.settings;
    } catch (error) {
      console.error('獲取設定失敗:', error);
      return null;
    }
  }

  /**
   * 強制刷新資料
   */
  async forceRefresh() {
    this.lastFetch = null;
    this.accountsData = null;
    return await this.fetchAccountsData();
  }
}

// 創建全域實例
window.adminAccountsService = new AdminAccountsService();
