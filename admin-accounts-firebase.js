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
        console.warn('Firebase 9 未載入，純 Firebase 模式需要 Firebase 連接');
        // 純 Firebase 模式，不進入本地模式
        return;
      }

      // 使用已載入的全域 Firebase 實例
      this.db = window.firebaseDb;
      this.auth = window.firebaseAuth;
      
      console.log('✅ Firebase 初始化成功，使用全域實例');
      this.startAutoSync();
      
    } catch (error) {
      console.error('Firebase 初始化失敗:', error);
      // 純 Firebase 模式，不進入本地模式
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
        const db = this.db || window.firebaseDb;
        if (db) {
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
   * 從 Firebase 獲取帳號資料（純 Firebase 模式）
   */
  async fetchAccountsData() {
    try {
      // 使用全域 Firebase 實例，確保連接正常
      const db = this.db || window.firebaseDb;
      if (!db || !window.firebase9Loaded) {
        throw new Error('Firebase 未初始化，無法獲取資料');
      }

      // 強制從 Firebase 獲取，不使用本地備份
      const { collection, getDocs, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      
      const accountsSnapshot = await getDocs(collection(db, this.accountsCollection));
      const accounts = [];
      
      accountsSnapshot.forEach(docSnapshot => {
        accounts.push({
          id: docSnapshot.id,
          ...docSnapshot.data()
        });
      });

      // 獲取設定
      const settingsDoc = await getDoc(doc(db, this.settingsCollection, 'main'));
      const settings = settingsDoc.exists() ? settingsDoc.data() : this.getDefaultSettings();

      const data = {
        last_updated: new Date().toISOString(),
        version: "2.0",
        accounts: accounts,
        settings: settings
      };

      // 不儲存本地備份，純 Firebase 模式
      console.log(`✅ 從 Firebase 獲取到 ${accounts.length} 個管理員帳號`);
      return data;

    } catch (error) {
      console.error('從 Firebase 獲取帳號資料失敗:', error);
      throw error; // 不返回本地備份，直接拋出錯誤
    }
  }

  /**
   * 同步到 Firebase
   */
  async syncToFirebase() {
    // 使用全域 Firebase 實例
    const db = this.db || window.firebaseDb;
    if (!db || !window.firebase9Loaded) {
      console.error('Firebase 未初始化，無法同步');
      return false;
    }

    try {
      // 直接從 Firebase 獲取最新資料進行同步
      const currentData = await this.fetchAccountsData();
      if (!currentData) return false;

      // 使用 Firebase 9 模組化 API
      const { writeBatch, collection, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      
      // 批次更新
      const batch = writeBatch(db);

      // 更新帳號
      for (const account of currentData.accounts) {
        const docRef = doc(db, this.accountsCollection, account.id);
        batch.set(docRef, account, { merge: true });
      }

      // 更新設定
      const settingsRef = doc(db, this.settingsCollection, 'main');
      batch.set(settingsRef, currentData.settings, { merge: true });

      await batch.commit();
      console.log('✅ 資料已同步到 Firebase');
      return true;

    } catch (error) {
      console.error('Firebase 同步失敗:', error);
      return false;
    }
  }

  /**
   * 從 Firebase 同步（純 Firebase 模式）
   */
  async syncToLocal() {
    try {
      const data = await this.fetchAccountsData();
      if (data) {
        // 純 Firebase 模式，不儲存本地備份
        console.log('✅ 已從 Firebase 同步最新資料');
        return true;
      }
      return false;
    } catch (error) {
      console.error('從 Firebase 同步失敗:', error);
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
   * 獲取資料（純 Firebase 模式）
   */
  async getLocalBackup() {
    try {
      // 純 Firebase 模式，直接從 Firebase 獲取
      return await this.fetchAccountsData();
    } catch (e) {
      console.error('從 Firebase 獲取資料失敗:', e);
      // 返回預設資料
      return this.getDefaultData();
    }
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
        
        // 純 Firebase 模式，不儲存本地備份
        
        // 如果 Firebase 可用，同步到雲端
        const db = this.db || window.firebaseDb;
        if (db) {
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

      // 直接將新帳號寫入 Firebase
      const db = this.db || window.firebaseDb;
      if (!db || !window.firebase9Loaded) {
        throw new Error('Firebase 未初始化，無法新增帳號');
      }

      console.log('直接將新管理員寫入 Firebase...');
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      
      // 直接寫入新帳號到 Firebase
      const accountRef = doc(db, this.accountsCollection, newId);
      await setDoc(accountRef, newAccount);
      
      console.log('✅ 新管理員已直接寫入 Firebase:', newId);
      return newAccount;

    } catch (error) {
      console.error('新增管理員帳號失敗:', error);
      throw error;
    }
  }

  /**
   * 刪除管理員帳號
   */
  async deleteAdminAccount(email) {
    try {
      const accountsData = await this.fetchAccountsData();
      
      // 找到要刪除的帳號
      const accountIndex = accountsData.accounts.findIndex(account => account.email === email);
      
      if (accountIndex === -1) {
        console.log('找不到要刪除的帳號:', email);
        return false;
      }
      
      const accountToDelete = accountsData.accounts[accountIndex];
      console.log('準備刪除帳號:', accountToDelete.name, accountToDelete.email, accountToDelete.id);
      
      // 從陣列中移除
      accountsData.accounts.splice(accountIndex, 1);
      accountsData.last_updated = new Date().toISOString();

      // 純 Firebase 模式，不儲存本地備份

      // 立即從 Firebase 刪除特定文檔
      const db = this.db || window.firebaseDb;
      if (db) {
        console.log('立即從 Firebase 刪除文檔:', accountToDelete.id);
        try {
          const { deleteDoc, doc } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
          const docRef = doc(db, this.accountsCollection, accountToDelete.id);
          await deleteDoc(docRef);
          console.log('✅ 管理員文檔已從 Firebase 刪除:', accountToDelete.id);
        } catch (firebaseError) {
          console.error('❌ 從 Firebase 刪除文檔失敗:', firebaseError);
          // 如果 Firebase 刪除失敗，嘗試使用 syncToFirebase 作為備用方案
          console.log('嘗試使用 syncToFirebase 作為備用方案...');
          const syncResult = await this.syncToFirebase();
          if (syncResult) {
            console.log('✅ 使用備用方案同步刪除成功');
          } else {
            console.warn('⚠️ 備用方案同步失敗，將在下一次自動同步時重試');
          }
        }
      }

      console.log('刪除管理員帳號成功:', email);
      return true;

    } catch (error) {
      console.error('刪除管理員帳號失敗:', error);
      throw error;
    }
  }

  /**
   * 更新管理員狀態
   */
  async updateAdminStatus(email) {
    try {
      const accountsData = await this.fetchAccountsData();
      
      // 找到要更新的帳號
      const account = accountsData.accounts.find(acc => acc.email === email);
      
      if (!account) {
        console.log('找不到要更新的帳號:', email);
        return false;
      }
      
      // 切換狀態
      const newStatus = account.status === 'active' ? 'inactive' : 'active';
      account.status = newStatus;
      account.updatedAt = new Date().toISOString();
      
      accountsData.last_updated = new Date().toISOString();

      // 純 Firebase 模式，不儲存本地備份

      // 立即同步到 Firebase
      const db = this.db || window.firebaseDb;
      if (db) {
        console.log('立即同步狀態更新到 Firebase...');
        const syncResult = await this.syncToFirebase();
        if (syncResult) {
          console.log('管理員狀態更新已同步到 Firebase');
        } else {
          console.warn('管理員狀態更新同步到 Firebase 失敗，將在下一次自動同步時重試');
        }
      }

      console.log('更新管理員狀態成功:', email, '新狀態:', newStatus);
      return true;

    } catch (error) {
      console.error('更新管理員狀態失敗:', error);
      throw error;
    }
  }

  /**
   * 測試連接
   */
  async testConnection() {
    try {
      const db = this.db || window.firebaseDb;
      if (db && window.firebase9Loaded) {
        // 測試 Firebase 連接
        const { collection, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
        
        const testDoc = await getDoc(doc(db, 'test', 'connection'));
        return {
          success: true,
          message: 'Firebase 連接正常',
          mode: 'firebase'
        };
      } else {
        // 純 Firebase 模式，Firebase 未初始化
        return {
          success: false,
          message: 'Firebase 未初始化，無法獲取資料',
          mode: 'firebase_required',
          accounts_count: 0
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
      const db = this.db || window.firebaseDb;
      if (db) {
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
      
      const db = this.db || window.firebaseDb;
      if (db) {
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
