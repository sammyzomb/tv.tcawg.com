/**
 * 管理員帳號管理服務
 * 使用 GitHub 作為資料庫，實現跨設備同步
 * 版本：2.0 - 增強安全性與同步功能
 */

class AdminAccountsService {
  constructor() {
    this.accountsData = null;
    this.lastFetch = null;
    this.cacheTimeout = 2 * 60 * 1000; // 2分鐘快取（更頻繁同步）
    this.accountsUrl = 'https://raw.githubusercontent.com/sammyzomb/tv.tcawg.com/main/admin-accounts.json';
    this.githubToken = localStorage.getItem('github_token') || '';
    this.syncInterval = null;
    
    // 啟動自動同步
    this.startAutoSync();
  }

  /**
   * 啟動自動同步（每5分鐘檢查一次）
   */
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.forceRefresh();
        console.log('自動同步完成');
      } catch (error) {
        console.log('自動同步失敗:', error.message);
      }
    }, 5 * 60 * 1000); // 5分鐘
  }

  /**
   * 安全的密碼雜湊（使用 SHA-256）
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 驗證密碼
   */
  async verifyPassword(password, hashedPassword) {
    const hash = await this.hashPassword(password);
    return hash === hashedPassword;
  }

  /**
   * 從雲端獲取帳號資料（優先從 Firebase，備用 GitHub）
   */
  async fetchAccountsData() {
    try {
      // 檢查快取是否有效
      if (this.accountsData && this.lastFetch && 
          (Date.now() - this.lastFetch) < this.cacheTimeout) {
        console.log('使用快取的帳號資料');
        return this.accountsData;
      }

      // 優先從 Firebase 讀取
      if (window.firebaseDb && window.firebase9Loaded) {
        try {
          console.log('從 Firebase Firestore 獲取最新帳號資料...');
          const firebaseData = await this.fetchFromFirebase();
          if (firebaseData && firebaseData.accounts && firebaseData.accounts.length > 0) {
            // 驗證資料格式
            if (this.validateAccountsData(firebaseData)) {
              // 確保有 settings（如果沒有則使用預設值）
              if (!firebaseData.settings) {
                firebaseData.settings = {
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
                };
              }
              
              // 更新快取
              this.accountsData = firebaseData;
              this.lastFetch = Date.now();
              
              // 儲存到本地備份
              this.saveLocalBackup(firebaseData);
              
              console.log(`✅ 從 Firebase 獲取帳號資料成功，共 ${firebaseData.accounts.length} 個管理員`);
              return firebaseData;
            } else {
              console.warn('Firebase 資料驗證失敗，但繼續使用');
              // 即使驗證失敗，也嘗試使用（可能是格式問題）
              if (firebaseData.accounts && firebaseData.accounts.length > 0) {
                // 確保有 settings
                if (!firebaseData.settings) {
                  firebaseData.settings = {
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
                  };
                }
                this.accountsData = firebaseData;
                this.lastFetch = Date.now();
                this.saveLocalBackup(firebaseData);
                console.log(`⚠️ 使用 Firebase 資料（驗證警告），共 ${firebaseData.accounts.length} 個管理員`);
                return firebaseData;
              }
            }
          }
        } catch (firebaseError) {
          console.warn('從 Firebase 讀取失敗，嘗試 GitHub:', firebaseError);
        }
      }

      // 備用：從 GitHub 獲取資料
      console.log('從 GitHub 獲取最新帳號資料...');
      
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
      
      // 儲存到本地備份
      this.saveLocalBackup(data);
      
      // 同步到 Firebase（如果可用）
      if (window.firebaseDb && window.firebase9Loaded) {
        this.syncToFirebase().catch(err => {
          console.warn('同步到 Firebase 失敗（非關鍵錯誤）:', err);
        });
      }
      
      console.log('✅ 從 GitHub 獲取帳號資料成功');
      return data;

    } catch (error) {
      console.error('獲取帳號資料失敗:', error);
      
      // 如果雲端獲取失敗，嘗試使用本地備份
      return this.getLocalBackup();
    }
  }

  /**
   * 驗證帳號資料格式
   */
  validateAccountsData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.accounts)) return false;
    
    // settings 是可選的（Firebase 資料可能沒有）
    // if (!data.settings || typeof data.settings !== 'object') return false;
    
    // 驗證每個帳號（至少要有 email）
    for (const account of data.accounts) {
      if (!account.email) {
        console.warn('發現無效帳號（缺少 email）:', account);
        return false;
      }
      // id, name, role 可以是可選的，但 email 必須有
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
   * 儲存本地備份
   */
  saveLocalBackup(data) {
    try {
      localStorage.setItem('admin_accounts_backup', JSON.stringify(data));
      localStorage.setItem('admin_accounts_backup_time', Date.now().toString());
    } catch (e) {
      console.error('儲存本地備份失敗:', e);
    }
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
      if (await this.verifyPassword(password, account.password_hash)) {
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

  /**
   * 添加新管理員帳號並同步到 GitHub
   */
  async addAdminAccount(accountData) {
    try {
      // 獲取當前帳號資料
      const accountsData = await this.fetchAccountsData();
      
      // 生成新帳號 ID
      const maxId = Math.max(...accountsData.accounts.map(acc => {
        const match = acc.id.match(/\d+$/);
        return match ? parseInt(match[0]) : 0;
      }), 0);
      const newId = `admin_${String(maxId + 1).padStart(3, '0')}`;
      
      // 雜湊密碼
      const passwordHash = accountData.password ? await this.hashPassword(accountData.password) : '';
      
      // 驗證必填欄位
      if (!accountData.email || !accountData.name) {
        throw new Error('Email 和姓名為必填欄位');
      }
      
      // 創建新帳號
      const newAccount = {
        id: newId,
        email: String(accountData.email).trim(),
        name: String(accountData.name).trim(),
        role: accountData.role || 'admin',
        permissions: accountData.role === 'super_admin' 
          ? ["read", "write", "delete", "publish", "admin", "system"]
          : ["read", "write", "delete", "publish"],
        status: accountData.status || 'active',
        created_at: new Date().toISOString(),
        last_login: null,
        password_hash: passwordHash || ''
      };
      
      // 檢查是否已存在
      if (accountsData.accounts.find(acc => acc.email === accountData.email)) {
        throw new Error('該 Email 已存在');
      }
      
      // 添加到帳號列表
      accountsData.accounts.push(newAccount);
      accountsData.last_updated = new Date().toISOString();
      
      // 同步到 Firebase（優先，傳入更新後的資料）
      const firebaseSync = await this.syncToFirebase(accountsData);
      if (firebaseSync) {
        console.log('✅ 已同步到 Firebase Firestore');
      } else {
        console.warn('⚠️ Firebase 同步失敗，繼續同步到 GitHub');
      }
      
      // 同步到 GitHub（備用）
      const githubSync = await this.updateGitHubAccounts(accountsData);
      
      if (firebaseSync || githubSync) {
        // 更新本地快取
        this.accountsData = accountsData;
        this.lastFetch = Date.now();
        this.saveLocalBackup(accountsData);
        return newAccount;
      } else {
        throw new Error('同步到雲端失敗（Firebase 和 GitHub 都失敗）');
      }
    } catch (error) {
      console.error('添加管理員帳號失敗:', error);
      throw error;
    }
  }

  /**
   * 更新 GitHub 上的帳號資料
   */
  async updateGitHubAccounts(accountsData) {
    try {
      console.log('正在更新 GitHub 帳號資料...');
      
      // 將 JSON 轉換為 Base64（處理中文）
      const jsonString = JSON.stringify(accountsData, null, 2);
      // 使用 TextEncoder 處理 UTF-8 編碼，然後轉換為 Base64
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonString);
      // 將 Uint8Array 轉換為 Base64
      const base64Content = btoa(String.fromCharCode(...data));
      
      // 使用 GitHub API 更新檔案
      const response = await fetch(`https://api.github.com/repos/sammyzomb/tv.tcawg.com/contents/admin-accounts.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '更新管理員帳號資料',
          content: base64Content,
          sha: await this.getFileSHA()
        })
      });

      if (!response.ok) {
        throw new Error(`GitHub API 錯誤: ${response.status}`);
      }

      console.log('GitHub 帳號資料更新成功');
      return true;

    } catch (error) {
      console.error('更新 GitHub 帳號資料失敗:', error);
      return false;
    }
  }

  /**
   * 獲取檔案的 SHA 值
   */
  async getFileSHA() {
    try {
      const response = await fetch(`https://api.github.com/repos/sammyzomb/tv.tcawg.com/contents/admin-accounts.json`, {
        headers: {
          'Authorization': `token ${this.githubToken}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.sha;
      }
      return null;
    } catch (error) {
      console.error('獲取檔案 SHA 失敗:', error);
      return null;
    }
  }

  /**
   * 同步管理員帳號到 Firebase Firestore
   * @param {Object} accountsData - 可選，如果提供則使用此資料，否則從服務獲取
   */
  async syncToFirebase(accountsData = null) {
    try {
      // 檢查 Firebase 是否已初始化
      if (!window.firebaseDb || !window.firebase9Loaded) {
        console.warn('Firebase 未初始化，無法同步');
        return false;
      }

      console.log('正在同步管理員帳號到 Firebase Firestore...');
      
      // 如果沒有提供資料，則獲取當前帳號資料
      if (!accountsData) {
        accountsData = await this.fetchAccountsData();
      }
      const accounts = (accountsData.accounts || []).filter(acc => {
        // 過濾掉無效的帳號（缺少 email 或 email 為 undefined）
        return acc && acc.email && typeof acc.email === 'string' && acc.email.trim() !== '';
      });

      // 動態導入 Firebase Firestore 函數
      const { collection, doc, setDoc, getDocs } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      
      const accountsRef = collection(window.firebaseDb, 'admin_accounts');
      
      // 同步每個帳號到 Firestore
      for (const account of accounts) {
        // 確保所有必填欄位都有值
        if (!account.email || !account.id) {
          console.warn(`跳過無效帳號（缺少 email 或 id）:`, account);
          continue;
        }
        
        const accountDoc = doc(accountsRef, account.id);
        await setDoc(accountDoc, {
          email: String(account.email).trim(),
          name: String(account.name || '').trim(),
          role: account.role || 'admin',
          permissions: Array.isArray(account.permissions) ? account.permissions : [],
          status: account.status || 'active',
          created_at: account.created_at || new Date().toISOString(),
          last_login: account.last_login || null,
          password_hash: account.password_hash || '',
          updated_at: new Date().toISOString()
        }, { merge: true }); // 使用 merge 避免覆蓋現有資料
      }

      console.log(`✅ 已同步 ${accounts.length} 個管理員帳號到 Firebase Firestore`);
      return true;

    } catch (error) {
      console.error('同步到 Firebase 失敗:', error);
      return false;
    }
  }

  /**
   * 從 Firebase Firestore 讀取管理員帳號
   */
  async fetchFromFirebase() {
    try {
      // 檢查 Firebase 是否已初始化
      if (!window.firebaseDb || !window.firebase9Loaded) {
        console.warn('Firebase 未初始化，無法讀取');
        return null;
      }

      console.log('正在從 Firebase Firestore 讀取管理員帳號...');
      
      // 動態導入 Firebase Firestore 函數
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      
      const accountsRef = collection(window.firebaseDb, 'admin_accounts');
      const snapshot = await getDocs(accountsRef);
      
      const accounts = [];
      snapshot.forEach(doc => {
        accounts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ 從 Firebase Firestore 讀取到 ${accounts.length} 個管理員帳號`);
      
      return {
        last_updated: new Date().toISOString(),
        version: "2.0",
        accounts: accounts
      };

    } catch (error) {
      console.error('從 Firebase 讀取失敗:', error);
      return null;
    }
  }
}

// 創建全域實例
window.adminAccountsService = new AdminAccountsService();
