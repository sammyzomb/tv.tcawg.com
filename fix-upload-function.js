// 修復版上架函數 - 解決 12:00 時段上架失敗問題
// 版本：1.0.0
// 建立日期：2025-01-15

/**
 * 修復版節目上架函數
 * 解決 Contentful 內容模型不匹配和欄位映射問題
 */
async function uploadProgramSimpleFixed(programData) {
  try {
    console.log('🚀 開始上架節目 (修復版):', programData);
    
    // 檢查 Management SDK
    if (typeof contentfulManagement === 'undefined') {
      throw new Error('Management SDK 未載入');
    }
    console.log('✅ Management SDK 已載入');

    // 檢查 API Token
    const managementToken = window.CONTENTFUL_CONFIG?.MANAGEMENT_TOKEN || window.CONTENTFUL_MANAGEMENT_TOKEN;
    if (!managementToken) {
      throw new Error('Management Token 未設定');
    }
    console.log('✅ Management Token 已設定');

    // 創建 Management 客戶端
    const managementClient = contentfulManagement.createClient({
      accessToken: managementToken
    });
    console.log('✅ Management 客戶端已創建');

    // 獲取 Space 和 Environment
    const spaceId = window.CONTENTFUL_CONFIG?.SPACE_ID || 'os5wf90ljenp';
    const space = await managementClient.getSpace(spaceId);
    const environment = await space.getEnvironment('master');
    console.log('✅ 已連接到 Contentful Space:', spaceId);

    // 首先檢查可用的內容類型
    console.log('🔍 檢查可用的內容類型...');
    const contentTypes = await environment.getContentTypes();
    console.log('可用的內容類型:', contentTypes.items.map(ct => ({ id: ct.sys.id, name: ct.name })));

    // 尋找合適的內容類型
    let scheduleContentType = null;
    let videoContentType = null;

    // 嘗試找到節目相關的內容類型
    const possibleScheduleTypes = ['scheduleItem', 'program', '節目', 'schedule', 'programItem'];
    const possibleVideoTypes = ['video', '影片', 'media', 'asset'];

    for (const ct of contentTypes.items) {
      if (possibleScheduleTypes.includes(ct.sys.id) || ct.name.includes('節目') || ct.name.includes('schedule')) {
        scheduleContentType = ct;
        console.log('✅ 找到節目內容類型:', ct.sys.id, ct.name);
        break;
      }
    }

    for (const ct of contentTypes.items) {
      if (possibleVideoTypes.includes(ct.sys.id) || ct.name.includes('影片') || ct.name.includes('video')) {
        videoContentType = ct;
        console.log('✅ 找到影片內容類型:', ct.sys.id, ct.name);
        break;
      }
    }

    if (!scheduleContentType) {
      throw new Error('找不到節目內容類型，請先在 Contentful 中創建 scheduleItem 內容類型');
    }

    // 準備資料
    const airDate = programData.airDate || new Date().toISOString().split('T')[0];
    const airTime = programData.airTime || '12:00';
    const block = getTimeBlock(airTime);
    const slotIndex = programData.slotNumber || 0;
    
    console.log('準備上架資料:', { title: programData.title, airDate, airTime, block, slotIndex });

    // 檢查重複節目
    const existingEntries = await environment.getEntries({
      content_type: scheduleContentType.sys.id,
      'fields.airDate': airDate,
      limit: 100
    });

    // 檢查是否有相同時間的節目
    const duplicateProgram = existingEntries.items.find(entry => {
      const entryNotes = String(entry.fields.notes || '');
      const timeMatch = entryNotes.match(/\[時間:(\d{2}:\d{2})\]/);
      const entryAirTime = timeMatch ? timeMatch[1] : null;
      return entryAirTime === airTime;
    });

    if (duplicateProgram) {
      console.log('⚠️ 發現重複時間段節目，跳過上架');
      return {
        success: true,
        entryId: duplicateProgram.sys.id,
        message: `該時間段 ${airTime} 已有節目，跳過重複上架`,
        skipped: true
      };
    }

    // 準備備註
    let notes = (programData.description || '') + ` [時間:${airTime}]`;
    if (programData.youtubeId) {
      notes += ` [YouTube:${programData.youtubeId}]`;
    }

    // 創建或獲取影片 Entry
    let videoEntry = null;
    if (programData.youtubeId && videoContentType) {
      try {
        // 檢查是否已存在相同的 YouTube ID
        const existingVideos = await environment.getEntries({
          content_type: videoContentType.sys.id,
          'fields.youtubeId': programData.youtubeId
        });

        if (existingVideos.items.length > 0) {
          videoEntry = existingVideos.items[0];
          console.log('✅ 找到現有的影片 Entry:', videoEntry.sys.id);
        } else {
          // 創建新的影片 Entry
          const videoFields = {
            'title': { 'en-US': programData.title || 'YouTube 影片' },
            'videoType': { 'en-US': 'YouTube' }
          };

          // 嘗試不同的欄位名稱
          if (videoContentType.fields.find(f => f.id === 'youtubeId')) {
            videoFields['youtubeId'] = { 'en-US': programData.youtubeId };
          } else if (videoContentType.fields.find(f => f.id === 'youTubeId')) {
            videoFields['youTubeId'] = { 'en-US': programData.youtubeId };
          } else if (videoContentType.fields.find(f => f.id === 'videoId')) {
            videoFields['videoId'] = { 'en-US': programData.youtubeId };
          }

          videoEntry = await environment.createEntry(videoContentType.sys.id, {
            fields: videoFields
          });

          await videoEntry.publish();
          console.log('✅ 創建新的影片 Entry:', videoEntry.sys.id);
        }
      } catch (error) {
        console.error('❌ 創建影片 Entry 失敗:', error);
        // 如果影片創建失敗，繼續創建節目 Entry，但不包含影片連結
      }
    }

    // 準備節目 Entry 資料
    const entryFields = {
      'title': { 'en-US': programData.title || '未命名節目' },
      'notes': { 'en-US': notes }
    };

    // 根據實際的內容類型欄位添加資料
    scheduleContentType.fields.forEach(field => {
      switch (field.id) {
        case 'airDate':
        case '播出日期':
          entryFields[field.id] = { 'en-US': airDate };
          break;
        case 'block':
        case '時段':
          entryFields[field.id] = { 'en-US': block };
          break;
        case 'slotIndex':
        case '時段索引':
          entryFields[field.id] = { 'en-US': slotIndex };
          break;
        case 'isPremiere':
        case 'isFirstBroadcast':
        case '首播':
          entryFields[field.id] = { 'en-US': programData.isFirstBroadcast || false };
          break;
        case 'category':
        case '分類':
        case '節目分類':
          entryFields[field.id] = { 'en-US': programData.category || '旅遊節目' };
          break;
        case 'duration':
        case '時長':
        case '節目時長':
          entryFields[field.id] = { 'en-US': programData.duration || 30 };
          break;
        case 'video':
        case '影片':
        case 'videoReference':
          if (videoEntry) {
            entryFields[field.id] = { 
              'en-US': { 
                sys: { 
                  type: 'Link', 
                  linkType: 'Entry', 
                  id: videoEntry.sys.id 
                } 
              } 
            };
          }
          break;
      }
    });

    const entryData = { fields: entryFields };
    console.log('準備上架的 Entry 資料:', entryData);

    // 創建節目 Entry
    const entry = await environment.createEntry(scheduleContentType.sys.id, entryData);
    console.log('✅ 節目 Entry 創建成功:', entry.sys.id);

    // 發布 Entry
    await entry.publish();
    console.log('✅ 節目 Entry 發布成功');

    return {
      success: true,
      entryId: entry.sys.id,
      message: '節目已成功上架到 Contentful',
      contentType: scheduleContentType.sys.id,
      videoEntryId: videoEntry ? videoEntry.sys.id : null
    };

  } catch (error) {
    console.error('❌ 上架失敗:', error);
    
    // 提供詳細的錯誤訊息
    let errorMessage = error.message;
    if (error.message.includes('Content Type')) {
      errorMessage = '內容類型不存在，請檢查 Contentful 設定';
    } else if (error.message.includes('Field')) {
      errorMessage = '欄位不存在，請檢查內容模型設定';
    } else if (error.message.includes('Token')) {
      errorMessage = 'API Token 設定錯誤，請檢查配置';
    }
    
    return {
      success: false,
      error: errorMessage,
      message: '節目上架失敗: ' + errorMessage,
      details: error.message
    };
  }
}

/**
 * 將時間轉換為時段範圍
 */
function getTimeBlock(timeString) {
  if (!timeString) return '12-18';
  
  const hour = parseInt(timeString.split(':')[0]);
  
  if (hour >= 0 && hour < 6) return '00-06';
  if (hour >= 6 && hour < 12) return '06-12';
  if (hour >= 12 && hour < 18) return '12-18';
  if (hour >= 18 && hour < 24) return '18-24';
  
  return '12-18'; // 預設值
}

/**
 * 測試修復版上架功能
 */
async function testFixedUpload() {
  const testProgram = {
    title: '測試節目 - 12:00 時段',
    airDate: '2024-01-15',
    airTime: '12:00',
    duration: 30,
    category: '亞洲旅遊',
    description: '測試 12:00 時段上架功能',
    status: 'scheduled',
    videoType: 'YouTube',
    youtubeId: 'dQw4w9WgXcQ'
  };

  console.log('🧪 測試修復版上架功能...');
  const result = await uploadProgramSimpleFixed(testProgram);
  
  if (result.success) {
    console.log('✅ 測試成功！', result);
    alert(`測試成功！\nEntry ID: ${result.entryId}\n內容類型: ${result.contentType}`);
  } else {
    console.error('❌ 測試失敗:', result);
    alert(`測試失敗：${result.error}\n詳細資訊：${result.details}`);
  }
  
  return result;
}

// 導出函數
if (typeof window !== 'undefined') {
  window.uploadProgramSimpleFixed = uploadProgramSimpleFixed;
  window.testFixedUpload = testFixedUpload;
}

console.log('✅ 修復版上架函數已載入');
