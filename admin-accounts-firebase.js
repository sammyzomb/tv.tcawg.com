/**
 * 管理員帳號管理服務 - Firebase 版本
 * 使用 Firebase Firestore 實現跨設備同步
 * 版本：2.0 - Firebase 同步系統
 */

class AdminAccountsFirebaseService {
  constructor() {
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.accountsCollection = 'admin_accounts';
    this.settingsCollection = 'admin_settings';
    this.syncInterval = null;
    
      // Firebase 配置
  this.firebaseConfig = {
    apiKey: "AIzaSyB5MLyG5H1sCflHFU7WeKQCmC0Ft5TIqjM",
    authDomain: "tv-tcawg-com.firebaseapp.com",
    projectId: "tv-tcawg-com",
    storageBucket: "tv-tcawg-com.firebasestorage.app",
    messagingSenderId: "313251141126",
    appId: "1:313251141126:web:88ef97ce28798c0a2e9587",
    measurementId: "G-83Z5VTRTZH"
  };
    
    this.init();
  }

  /**
   * 初始化 Firebase
   */
  async init() {
    try {
      // 檢查 Firebase 9 模組是否已載入
      if (typeof window.firebase9Loaded === 'undefined' || !window.firebase9Loaded) {
        console.warn('Firebase 9 未載入，使用本地模式');
        this.startLocalMode();
        return;
      }

      // 使用已載入的全域 Firebase 實例
      this.db = window.firebaseDb;
      this.auth = window.firebaseAuth;
      
      console.log('Firebase 初始化成功，使用全域實例');
      this.startAutoSync();
      
    } catch (error) {
      console.error('Firebase 初始化失敗:', error);
      this.startLocalMode();
    }
  }

  /**
   * 啟動本地模式（當 Firebase 不可用時）
   */
  startLocalMode() {
    console.log('啟動本地模式');
    this.db = null;
    this.auth = null;
    
    // 使用本地儲存
    this.startLocalSync();
  }

  /**
   * 啟動自動同步
   */
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // 每 30 秒同步一次，確保跨裝置即時同步
    this.syncInterval = setInterval(async () => {
      try {
        if (this.db) {
          await this.syncToFirebase();
        } else {
          await this.syncToLocal();
        }
        console.log('自動同步完成');
      } catch (error) {
        console.log('自動同步失敗:', error.message);
      }
    }, 30 * 1000); // 30 秒
  }

  /**
   * 啟動本地同步
   */
  startLocalSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // 每 5 分鐘檢查一次本地備份
    this.syncInterval = setInterval(async () => {
      try {
        await this.syncToLocal();
        console.log('本地同步完成');
      } catch (error) {
        console.log('本地同步失敗:', error.message);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * 安全的密碼雜湊
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
   * 從 Firebase 獲取帳號資料
   */
  async fetchAccountsData() {
    try {
      if (this.db && window.firebase9Loaded) {
        // 從 Firebase 獲取
        const { collection, getDocs, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
        
        const accountsSnapshot = await getDocs(collection(this.db, this.accountsCollection));
        const accounts = [];
        
        accountsSnapshot.forEach(docSnapshot => {
          accounts.push({
            id: docSnapshot.id,
            ...docSnapshot.data()
          });
        });

        // 獲取設定
        const settingsDoc = await getDoc(doc(this.db, this.settingsCollection, 'main'));
        const settings = settingsDoc.exists() ? settingsDoc.data() : this.getDefaultSettings();

        const data = {
          last_updated: new Date().toISOString(),
          version: "2.0",
          accounts: accounts,
          settings: settings
        };

        // 儲存本地備份
        this.saveLocalBackup(data);
        return data;

      } else {
        // 使用本地備份
        return this.getLocalBackup();
      }

    } catch (error) {
      console.error('獲取帳號資料失敗:', error);
      return this.getLocalBackup();
    }
  }

  /**
   * 同步到 Firebase
   */
  async syncToFirebase() {
    if (!this.db || !window.firebase9Loaded) return false;

    try {
      const localData = this.getLocalBackup();
      if (!localData) return false;

      // 使用 Firebase 9 模組化 API
      const { writeBatch, collection, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      
      // 批次更新
      const batch = writeBatch(this.db);

      // 更新帳號
      for (const account of localData.accounts) {
        const docRef = doc(this.db, this.accountsCollection, account.id);
        batch.set(docRef, account, { merge: true });
      }

      // 更新設定
      const settingsRef = doc(this.db, this.settingsCollection, 'main');
      batch.set(settingsRef, localData.settings, { merge: true });

      await batch.commit();
      console.log('Firebase 同步成功');
      return true;

    } catch (error) {
      console.error('Firebase 同步失敗:', error);
      return false;
    }
  }

  /**
   * 同步到本地
   */
  async syncToLocal() {
    try {
      const data = await this.fetchAccountsData();
      if (data) {
        this.saveLocalBackup(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('本地同步失敗:', error);
      return false;
    }
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
   * 獲取本地備份
   */
  getLocalBackup() {
    try {
      const backup = localStorage.getItem('admin_accounts_backup');
      if (backup) {
        return JSON.parse(backup);
      }
    } catch (e) {
      console.error('本地備份資料損壞:', e);
    }

    // 返回預設資料
    return this.getDefaultData();
  }

  /**
   * 獲取預設資料
   */
  getDefaultData() {
    return {
      last_updated: new Date().toISOString(),
      version: "2.0",
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
          password_hash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918" // SHA-256 雜湊值
        }
      ],
      settings: this.getDefaultSettings()
    };
  }

  /**
   * 獲取預設設定
   */
  getDefaultSettings() {
    return {
      max_login_attempts: 5,
      lockout_duration_minutes: 15,
      session_timeout_hours: 8,
      password_policy: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special_chars: true
      },
      sync_enabled: true,
      sync_interval_minutes: 2
    };
  }

  /**
   * 驗證用戶登入
   */
  async authenticateUser(email, password) {
    try {
      // 登入時強制從 Firebase 獲取最新資料，確保跨裝置同步
      console.log('登入驗證：強制從 Firebase 獲取最新管理員資料...');
      const accountsData = await this.fetchAccountsData();
      const account = accountsData.accounts.find(acc => 
        acc.email === email && acc.status === 'active'
      );

      if (!account) {
        console.log('找不到帳號或帳號已停用');
        return null;
      }

      // 檢查密碼
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
      const accountsData = await this.fetchAccountsData();
      const account = accountsData.accounts.find(acc => acc.id === accountId);
      
      if (account) {
        account.last_login = new Date().toISOString();
        
        // 更新本地資料
        this.saveLocalBackup(accountsData);
        
        // 如果 Firebase 可用，同步到雲端
        if (this.db) {
          await this.syncToFirebase();
        }
      }
    } catch (error) {
      console.error('更新最後登入時間失敗:', error);
    }
  }

  /**
   * 新增管理員帳號
   */
  async addAdminAccount(accountData) {
    try {
      const accountsData = await this.fetchAccountsData();
      
      // 生成新 ID
      const newId = `admin_${Date.now()}`;
      
      // 雜湊密碼
      const hashedPassword = await this.hashPassword(accountData.password);
      
      const newAccount = {
        id: newId,
        email: accountData.email,
        name: accountData.name,
        role: accountData.role || 'admin',
        permissions: accountData.permissions || ['read', 'write'],
        status: 'active',
        created_at: new Date().toISOString(),
        last_login: null,
        password_hash: hashedPassword
      };

      accountsData.accounts.push(newAccount);
      accountsData.last_updated = new Date().toISOString();

      // 儲存本地
      this.saveLocalBackup(accountsData);

      // 立即同步到 Firebase，確保跨裝置即時可用
      if (this.db) {
        console.log('立即同步新管理員到 Firebase...');
        const syncResult = await this.syncToFirebase();
        if (syncResult) {
          console.log('新管理員已同步到 Firebase，其他裝置可以立即使用');
        } else {
          console.warn('新管理員同步到 Firebase 失敗，將在下一次自動同步時重試');
        }
      }

      console.log('新增管理員帳號成功');
      return newAccount;

    } catch (error) {
      console.error('新增管理員帳號失敗:', error);
      throw error;
    }
  }

  /**
   * 測試連接
   */
  async testConnection() {
    try {
      if (this.db && window.firebase9Loaded) {
        // 測試 Firebase 連接
        const { collection, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
        
        const testDoc = await getDoc(doc(this.db, 'test', 'connection'));
        return {
          success: true,
          message: 'Firebase 連接正常',
          mode: 'firebase'
        };
      } else {
        // 測試本地模式
        const localData = this.getLocalBackup();
        return {
          success: true,
          message: '本地模式正常',
          mode: 'local',
          accounts_count: localData.accounts.length
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        mode: 'error'
      };
    }
  }

  /**
   * 強制刷新資料
   */
  async forceRefresh() {
    try {
      if (this.db) {
        // 從 Firebase 強制刷新
        console.log('強制從 Firebase 刷新資料...');
        const result = await this.syncToFirebase();
        if (result) {
          await this.syncToLocal();
          console.log('強制刷新成功，資料已同步到本地');
        }
        return result;
      } else {
        // 本地模式，重新載入備份
        return await this.syncToLocal();
      }
    } catch (error) {
      console.error('強制刷新失敗:', error);
      return false;
    }
  }

  /**
   * 手動強制同步（供管理員使用）
   */
  async manualSync() {
    try {
      console.log('開始手動強制同步...');
      
      if (this.db) {
        // 先從 Firebase 獲取最新資料
        console.log('從 Firebase 獲取最新資料...');
        const firebaseData = await this.fetchAccountsData();
        
        // 再同步本地資料到 Firebase
        console.log('同步本地資料到 Firebase...');
        const syncResult = await this.syncToFirebase();
        
        if (syncResult) {
          console.log('手動同步成功！所有裝置資料已同步');
          return {
            success: true,
            message: '同步成功！所有裝置資料已更新',
            accounts_count: firebaseData.accounts.length,
            last_updated: firebaseData.last_updated
          };
        } else {
          throw new Error('同步到 Firebase 失敗');
        }
      } else {
        throw new Error('Firebase 未連接，無法同步');
      }
    } catch (error) {
      console.error('手動同步失敗:', error);
      return {
        success: false,
        message: `同步失敗：${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * 獲取所有帳號
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
   * 獲取設定
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
}

// 創建全域實例
window.adminAccountsFirebaseService = new AdminAccountsFirebaseService();

// 為了向後相容，也創建舊的服務名稱
window.adminAccountsService = window.adminAccountsFirebaseService;
