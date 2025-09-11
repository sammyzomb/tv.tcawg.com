// 從 Contentful 獲取真實節目數據並更新 schedule.json
async function getRealProgramsFromContentful() {
  try {
    console.log('🎯 開始從 Contentful 獲取真實節目數據...');
    
    // 檢查 Contentful 是否可用
    if (typeof contentful === 'undefined') {
      throw new Error('Contentful SDK 未載入');
    }

    // 創建 Contentful 客戶端
    const client = contentful.createClient({
      space: 'os5wf90ljenp',
      accessToken: 'lODH-WLwHwVZv7O4rFdBWjSnrzaQWGD4koeOZ1Dypj0'
    });

    // 獲取所有已上架的節目 - 嘗試多種查詢方式
    let response;
    
    try {
      // 方式1：查詢所有 scheduleItem
      response = await client.getEntries({
        content_type: 'scheduleItem',
        include: 2,
        limit: 1000
      });
      console.log('方式1 查詢結果:', response.items?.length || 0, '個節目');
    } catch (error) {
      console.log('方式1 查詢失敗:', error.message);
    }
    
    // 如果方式1沒有結果，嘗試方式2：查詢所有內容類型
    if (!response || !response.items || response.items.length === 0) {
      try {
        console.log('嘗試查詢所有內容類型...');
        response = await client.getEntries({
          include: 2,
          limit: 1000
        });
        console.log('方式2 查詢結果:', response.items?.length || 0, '個項目');
        
        // 過濾出 scheduleItem 類型的項目
        if (response.items) {
          response.items = response.items.filter(item => 
            item.sys.contentType?.sys?.id === 'scheduleItem'
          );
          console.log('過濾後的 scheduleItem:', response.items.length, '個節目');
        }
      } catch (error) {
        console.log('方式2 查詢失敗:', error.message);
      }
    }

    console.log(`✅ 從 Contentful 載入 ${response?.items?.length || 0} 個真實節目`);

    if (!response || !response.items || response.items.length === 0) {
      console.log('⚠️ 沒有找到已上架的節目，請先在統一節目管理系統中上架節目');
      console.log('調試資訊:');
      console.log('- Contentful 空間 ID:', 'os5wf90ljenp');
      console.log('- 查詢的內容類型: scheduleItem');
      console.log('- 回應物件:', response);
      return null;
    }

    // 轉換為節目表格式
    const scheduleData = {};
    
    response.items.forEach(item => {
      const fields = item.fields;
      const airDate = fields.airDate;
      const title = fields.title;
      const notes = fields.notes || '';
      
      // 從備註中提取具體時間，格式為 [時間:XX:XX]
      const timeMatch = notes.match(/\[時間:(\d{2}:\d{2})\]/);
      const actualTime = timeMatch ? timeMatch[1] : '12:00';
      
      // 從備註中提取 YouTube ID，格式為 [YouTube:XXXXX]
      const youtubeMatch = notes.match(/\[YouTube:([^\]]+)\]/);
      const youtubeId = youtubeMatch ? youtubeMatch[1] : '';
      
      // 計算日期對應的星期幾
      const date = new Date(airDate);
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[date.getDay()];
      
      // 初始化日期數據
      if (!scheduleData[dayName]) {
        scheduleData[dayName] = {
          date: airDate,
          dayOfWeek: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
          month: (date.getMonth() + 1).toString(),
          day: date.getDate().toString(),
          schedule: []
        };
      }
      
      // 清理描述文字，移除時間和 YouTube 標記
      let cleanDescription = notes
        .replace(/\[時間:\d{2}:\d{2}\]/g, '')
        .replace(/\[YouTube:[^\]]+\]/g, '')
        .trim();
      
      // 如果沒有描述，使用標題
      if (!cleanDescription) {
        cleanDescription = title;
      }
      
      // 添加節目到對應日期
      const program = {
        time: actualTime,
        title: title,
        duration: '30', // 預設 30 分鐘
        category: '旅遊節目',
        description: cleanDescription,
        thumbnail: youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop',
        youtubeId: youtubeId,
        status: 'published'
      };
      
      scheduleData[dayName].schedule.push(program);
    });

    // 按時間排序每個日期的節目
    Object.keys(scheduleData).forEach(day => {
      scheduleData[day].schedule.sort((a, b) => a.time.localeCompare(b.time));
    });

    console.log('📊 轉換後的節目表數據:', scheduleData);
    
    return scheduleData;
    
  } catch (error) {
    console.error('❌ 從 Contentful 獲取節目失敗:', error);
    return null;
  }
}

// 更新 schedule.json 檔案
async function updateScheduleWithRealData() {
  const realData = await getRealProgramsFromContentful();
  
  if (!realData) {
    console.log('❌ 無法獲取真實節目數據');
    return;
  }
  
  try {
    // 將真實數據寫入 schedule.json
    const fs = require('fs');
    const jsonData = JSON.stringify(realData, null, 2);
    
    fs.writeFileSync('schedule.json', jsonData, 'utf8');
    
    console.log('✅ 成功更新 schedule.json 為真實節目數據');
    console.log(`📈 檔案大小: ${jsonData.length} bytes`);
    
    // 顯示統計資訊
    const totalPrograms = Object.values(realData).reduce((sum, day) => sum + day.schedule.length, 0);
    console.log(`📺 總節目數: ${totalPrograms}`);
    console.log(`📅 涵蓋日期: ${Object.keys(realData).length} 天`);
    
  } catch (error) {
    console.error('❌ 更新 schedule.json 失敗:', error);
  }
}

// 如果在瀏覽器環境中執行
if (typeof window !== 'undefined') {
  window.getRealProgramsFromContentful = getRealProgramsFromContentful;
  window.updateScheduleWithRealData = updateScheduleWithRealData;
}

// 如果在 Node.js 環境中執行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getRealProgramsFromContentful, updateScheduleWithRealData };
}
