// === 高端旅遊電視台美觀套件整合 JavaScript ===

// 等待 DOM 載入完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌟 高端旅遊電視台美觀套件已載入！');
    
    // 初始化 AOS 動畫
    initAOS();
    
    // 初始化 Swiper 輪播
    initSwiper();
    
    // 初始化 Lightbox
    initLightbox();
    
    // 添加滾動動畫
    addScrollAnimations();
    
    // 添加互動效果
    addInteractiveEffects();
    
    // 初始化旅遊特色功能
    initTravelFeatures();
});

// 初始化 AOS (Animate On Scroll) 動畫
function initAOS() {
    // 如果 AOS 套件已載入
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            easing: 'ease-out-cubic',
            once: true,
            offset: 120,
            delay: 100
        });
        console.log('✨ AOS 動畫已初始化');
    } else {
        // 手動實現簡單的滾動動畫
        console.log('📝 使用自定義滾動動畫');
    }
}

// 初始化 Swiper 輪播
function initSwiper() {
    // 查找所有需要輪播的容器
    const swiperContainers = document.querySelectorAll('.swiper-container');
    
    swiperContainers.forEach((container, index) => {
        if (typeof Swiper !== 'undefined') {
            new Swiper(container, {
                slidesPerView: 1,
                spaceBetween: 40,
                loop: true,
                autoplay: {
                    delay: 6000,
                    disableOnInteraction: false,
                },
                pagination: {
                    el: container.querySelector('.swiper-pagination'),
                    clickable: true,
                    dynamicBullets: true,
                },
                navigation: {
                    nextEl: container.querySelector('.swiper-button-next'),
                    prevEl: container.querySelector('.swiper-button-prev'),
                },
                breakpoints: {
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 30,
                    },
                    1024: {
                        slidesPerView: 3,
                        spaceBetween: 40,
                    }
                },
                effect: 'slide',
                speed: 800,
            });
            console.log(`🎠 Swiper 輪播 ${index + 1} 已初始化`);
        }
    });
}

// 初始化 Lightbox 圖片燈箱
function initLightbox() {
    if (typeof lightbox !== 'undefined') {
        lightbox.option({
            'resizeDuration': 300,
            'wrapAround': true,
            'albumLabel': '旅遊圖片 %1 / %2',
            'fadeDuration': 300,
            'imageFadeDuration': 300
        });
        console.log('🖼️ Lightbox 已初始化');
    }
}

// 添加滾動動畫
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // 觀察所有需要動畫的元素
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
}

// 添加互動效果
function addInteractiveEffects() {
    // 按鈕點擊效果
    const buttons = document.querySelectorAll('.btn-luxury');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 創建優雅的漣漪效果
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-luxury');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 800);
        });
    });
    
    // 卡片懸停效果
    const cards = document.querySelectorAll('.card-luxury');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px) scale(1.01)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// 初始化旅遊特色功能
function initTravelFeatures() {
    // 目的地標籤互動
    const destinationTags = document.querySelectorAll('.tag-luxury');
    destinationTags.forEach(tag => {
        tag.addEventListener('click', function() {
            // 移除其他標籤的選中狀態
            destinationTags.forEach(t => t.classList.remove('selected'));
            // 添加當前標籤的選中狀態
            this.classList.add('selected');
            
            // 觸發目的地篩選
            filterDestinations(this.textContent);
        });
    });
    
    // 旅遊影片預覽
    const videoThumbnails = document.querySelectorAll('.video-thumbnail');
    videoThumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            playVideoPreview(this.dataset.videoId);
        });
    });
}

// 目的地篩選功能
function filterDestinations(destination) {
    console.log(`篩選目的地: ${destination}`);
    // 這裡可以實現具體的篩選邏輯
    showNotification(`已篩選 ${destination} 相關內容`, 'info');
}

// 播放影片預覽
function playVideoPreview(videoId) {
    console.log(`播放影片預覽: ${videoId}`);
    // 這裡可以實現影片播放邏輯
    showNotification('影片預覽功能已啟動', 'success');
}

// 添加載入動畫
function showLoading(element) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-luxury';
    element.appendChild(spinner);
}

function hideLoading(element) {
    const spinner = element.querySelector('.loading-luxury');
    if (spinner) {
        spinner.remove();
    }
}

// 添加高端通知提示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-luxury notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="關閉通知">&times;</button>
        </div>
    `;
    
    // 添加樣式
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: var(--deep-navy);
        color: var(--warm-white);
        padding: 20px 24px;
        border-radius: 8px;
        box-shadow: 0 8px 32px var(--shadow-medium);
        z-index: 10000;
        min-width: 300px;
        border-left: 4px solid var(--luxury-gold);
        animation: slideInRight 0.4s ease-out;
        font-family: inherit;
    `;
    
    // 通知內容樣式
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    `;
    
    // 關閉按鈕樣式
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--luxury-gold);
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s ease;
    `;
    
    closeBtn.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(212, 175, 55, 0.1)';
    });
    
    closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'none';
    });
    
    document.body.appendChild(notification);
    
    // 自動關閉
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => notification.remove(), 400);
    }, 5000);
    
    // 手動關閉
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.4s ease-out';
        setTimeout(() => notification.remove(), 400);
    });
}

// 旅遊特色功能
function showDestinationInfo(destination) {
    const info = document.createElement('div');
    info.className = 'destination-info-luxury';
    info.innerHTML = `
        <h3>${destination}</h3>
        <p>探索這個令人驚嘆的旅遊目的地</p>
        <button class="btn-luxury" onclick="exploreDestination('${destination}')">
            深入了解
        </button>
    `;
    
    // 這裡可以實現目的地資訊顯示邏輯
    showNotification(`正在載入 ${destination} 的詳細資訊...`, 'info');
}

function exploreDestination(destination) {
    console.log(`探索目的地: ${destination}`);
    showNotification(`正在為您準備 ${destination} 的精彩內容`, 'success');
}

// 導出函數供其他腳本使用
window.LuxuryTravelUI = {
    showLoading,
    hideLoading,
    showNotification,
    initAOS,
    initSwiper,
    initLightbox,
    showDestinationInfo,
    exploreDestination,
    filterDestinations
};
