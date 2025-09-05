// 版本檢查工具
class VersionChecker {
    constructor() {
        this.version = '1.0.0';
        this.lastCheck = null;
        this.checkResults = {};
    }

    // 檢查版本一致性
    async checkVersionConsistency() {
        const results = {
            local: await this.getLocalVersion(),
            remote: await this.getRemoteVersion(),
            online: await this.getOnlineVersion()
        };

        this.checkResults = results;
        this.lastCheck = new Date();

        return this.analyzeResults(results);
    }

    // 獲取本地版本
    async getLocalVersion() {
        try {
            // 檢查關鍵檔案的最後修改時間
            const files = ['index.html', 'script.js', 'schedule.json'];
            const fileInfo = {};

            for (const file of files) {
                try {
                    const response = await fetch(file);
                    if (response.ok) {
                        const lastModified = response.headers.get('last-modified');
                        fileInfo[file] = {
                            exists: true,
                            lastModified: lastModified,
                            size: response.headers.get('content-length')
                        };
                    } else {
                        fileInfo[file] = {
                            exists: false,
                            error: `HTTP ${response.status}`
                        };
                    }
                } catch (error) {
                    fileInfo[file] = {
                        exists: false,
                        error: error.message
                    };
                }
            }

            return {
                type: 'local',
                files: fileInfo,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                type: 'local',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 獲取遠端版本 (模擬)
    async getRemoteVersion() {
        // 實際應用中應該通過 API 獲取
        return {
            type: 'remote',
            commit: 'remote-commit-hash',
            timestamp: new Date().toISOString(),
            note: '需要後端 API 支援'
        };
    }

    // 獲取線上版本
    async getOnlineVersion() {
        try {
            // 由於 CORS 限制，無法直接檢查
            // 實際應用中應該通過後端 API 獲取
            return {
                type: 'online',
                url: 'https://tv.tcawg.com',
                accessible: false,
                note: '需要後端 API 支援',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                type: 'online',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 分析檢查結果
    analyzeResults(results) {
        const analysis = {
            status: 'unknown',
            issues: [],
            recommendations: []
        };

        // 檢查本地檔案
        if (results.local.files) {
            const missingFiles = Object.entries(results.local.files)
                .filter(([file, info]) => !info.exists)
                .map(([file]) => file);

            if (missingFiles.length > 0) {
                analysis.issues.push(`缺少檔案: ${missingFiles.join(', ')}`);
                analysis.recommendations.push('請檢查檔案是否正確下載');
            }
        }

        // 檢查版本一致性
        if (results.local.commit && results.remote.commit) {
            if (results.local.commit !== results.remote.commit) {
                analysis.issues.push('本地版本與遠端版本不一致');
                analysis.recommendations.push('請執行 git pull 同步最新版本');
            }
        }

        // 確定整體狀態
        if (analysis.issues.length === 0) {
            analysis.status = 'healthy';
        } else if (analysis.issues.length <= 2) {
            analysis.status = 'warning';
        } else {
            analysis.status = 'error';
        }

        return analysis;
    }

    // 生成檢查報告
    generateReport() {
        const report = {
            timestamp: this.lastCheck,
            version: this.version,
            results: this.checkResults,
            analysis: this.analyzeResults(this.checkResults)
        };

        return report;
    }

    // 顯示檢查結果
    displayResults(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const report = this.generateReport();
        
        container.innerHTML = `
            <div class="version-report">
                <h3>版本檢查報告</h3>
                <div class="report-meta">
                    <p><strong>檢查時間:</strong> ${report.timestamp}</p>
                    <p><strong>工具版本:</strong> ${report.version}</p>
                    <p><strong>整體狀態:</strong> <span class="status-${report.analysis.status}">${this.getStatusText(report.analysis.status)}</span></p>
                </div>
                
                <div class="report-details">
                    <h4>檢查結果</h4>
                    <pre>${JSON.stringify(report.results, null, 2)}</pre>
                </div>
                
                <div class="report-issues">
                    <h4>發現問題</h4>
                    ${report.analysis.issues.length > 0 ? 
                        `<ul>${report.analysis.issues.map(issue => `<li>${issue}</li>`).join('')}</ul>` :
                        '<p>沒有發現問題</p>'
                    }
                </div>
                
                <div class="report-recommendations">
                    <h4>建議操作</h4>
                    ${report.analysis.recommendations.length > 0 ? 
                        `<ul>${report.analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>` :
                        '<p>無需額外操作</p>'
                    }
                </div>
            </div>
        `;
    }

    // 獲取狀態文字
    getStatusText(status) {
        const statusMap = {
            'healthy': '✅ 正常',
            'warning': '⚠️ 警告',
            'error': '❌ 錯誤',
            'unknown': '❓ 未知'
        };
        return statusMap[status] || '❓ 未知';
    }

    // 自動檢查
    async autoCheck(interval = 300000) { // 5分鐘
        await this.checkVersionConsistency();
        
        setTimeout(() => {
            this.autoCheck(interval);
        }, interval);
    }
}

// 全域實例
window.versionChecker = new VersionChecker();

// 自動初始化
document.addEventListener('DOMContentLoaded', function() {
    if (window.versionChecker) {
        // 執行初始檢查
        window.versionChecker.checkVersionConsistency().then(() => {
            console.log('版本檢查完成');
        });
    }
});

// 匯出供其他腳本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VersionChecker;
}
