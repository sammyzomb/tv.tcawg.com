// login.js：會員登入功能
(function(){
  // 初始化 Contentful client
  const contentfulClient = contentful.createClient({
    space: 'os5wf90ljenp',
    accessToken: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0'
  });

  // DOM 元素
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberCheckbox = document.getElementById('remember');
  const loginBtn = document.getElementById('login-btn');
  const loginText = document.getElementById('login-text');
  const loginLoading = document.getElementById('login-loading');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  // 顯示錯誤訊息
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
  }

  // 顯示成功訊息
  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
  }

  // 隱藏所有訊息
  function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
  }

  // 設置載入狀態
  function setLoading(loading) {
    if (loading) {
      loginBtn.disabled = true;
      loginText.style.display = 'none';
      loginLoading.style.display = 'inline-block';
    } else {
      loginBtn.disabled = false;
      loginText.style.display = 'inline';
      loginLoading.style.display = 'none';
    }
  }

  // 驗證電子郵件格式
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 驗證密碼強度
  function validatePassword(password) {
    return password.length >= 6;
  }

  // 處理登入表單提交
  async function handleLogin(event) {
    event.preventDefault();
    
    hideMessages();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const remember = rememberCheckbox.checked;

    // 基本驗證
    if (!email) {
      showError('請輸入電子郵件地址');
      emailInput.focus();
      return;
    }

    if (!validateEmail(email)) {
      showError('請輸入有效的電子郵件地址');
      emailInput.focus();
      return;
    }

    if (!password) {
      showError('請輸入密碼');
      passwordInput.focus();
      return;
    }

    if (!validatePassword(password)) {
      showError('密碼至少需要 6 個字元');
      passwordInput.focus();
      return;
    }

    setLoading(true);

    try {
      // 這裡可以連接到實際的認證系統
      // 目前使用模擬登入
      await simulateLogin(email, password, remember);
      
    } catch (error) {
      console.error('登入失敗：', error);
      showError('登入失敗，請檢查您的帳戶資訊');
    } finally {
      setLoading(false);
    }
  }

  // 模擬登入過程
  async function simulateLogin(email, password, remember) {
    // 模擬 API 延遲
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 檢查是否為測試帳戶
    if (email === 'test@example.com' && password === '123456') {
      showSuccess('登入成功！正在跳轉...');
      
      // 儲存登入狀態
      if (remember) {
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
      } else {
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('userEmail', email);
      }

      // 延遲跳轉
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
      
      return;
    }

    // 檢查是否為管理員帳戶
    if (email === 'admin@tcawg.com' && password === 'admin123') {
      showSuccess('管理員登入成功！正在跳轉...');
      
      // 儲存管理員狀態
      if (remember) {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminEmail', email);
      } else {
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminEmail', email);
      }

      // 延遲跳轉到管理後台
      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 1500);
      
      return;
    }

    // 其他情況視為登入失敗
    throw new Error('帳戶或密碼錯誤');
  }

  // 社群登入
  function socialLogin(provider) {
    hideMessages();
    showError(`${provider} 登入功能正在開發中，請稍後再試`);
  }

  // 顯示註冊頁面
  function showRegister() {
    hideMessages();
    showError('註冊功能正在開發中，請稍後再試');
  }

  // 檢查是否已登入
  function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('userLoggedIn') || sessionStorage.getItem('userLoggedIn');
    const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') || sessionStorage.getItem('adminLoggedIn');
    
    if (isLoggedIn || isAdminLoggedIn) {
      // 如果已登入，跳轉到首頁
      window.location.href = 'index.html';
    }
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', () => {
    // 檢查登入狀態
    checkLoginStatus();
    
    // 綁定表單提交事件
    loginForm.addEventListener('submit', handleLogin);
    
    // 綁定輸入框事件
    emailInput.addEventListener('input', hideMessages);
    passwordInput.addEventListener('input', hideMessages);
    
    // 自動聚焦到電子郵件輸入框
    emailInput.focus();
  });

  // 全域函數（供 HTML 調用）
  window.socialLogin = socialLogin;
  window.showRegister = showRegister;
})();
