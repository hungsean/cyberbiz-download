document.addEventListener('DOMContentLoaded', function() {
    const orderExportBtn = document.getElementById('orderExportBtn');
    const statusDiv = document.getElementById('status');
    const webhookUrlInput = document.getElementById('webhookUrl');
    const saveWebhookBtn = document.getElementById('saveWebhookBtn');

    // 載入已保存的 webhook URL
    chrome.storage.sync.get(['webhookUrl'], function(result) {
        if (result.webhookUrl) {
            webhookUrlInput.value = result.webhookUrl;
        }
    });

    // 檢查是否有待顯示的任務結果
    chrome.storage.local.get(['lastTaskResult'], function(result) {
        if (result.lastTaskResult) {
            const taskResult = result.lastTaskResult;
            console.log('發現待顯示的任務結果:', taskResult);

            // 由 background 完全控制顯示內容
            const message = taskResult.message || (taskResult.success ? '執行成功' : '執行失敗');
            const messageType = taskResult.messageType || (taskResult.success ? 'success' : 'error');

            showStatus(message, messageType);

            // 如果有詳細資訊,可以記錄到 console
            if (taskResult.details) {
                console.log('任務詳細資訊:', taskResult.details);
            }

            // 清除已顯示的結果
            chrome.storage.local.remove(['lastTaskResult']);
        }
    });

    function getLastMonth() {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const year = lastMonth.getFullYear();
        const month = lastMonth.getMonth() + 1;
        return {
            year: year,
            month: month,
            monthStr: month.toString().padStart(2, '0'),
            displayName: `${year}年${month}月`
        };
    }

    function showStatus(message, type = 'info') {
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';

        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
    }

    // 訂單匯出按鈕
    orderExportBtn.addEventListener('click', async () => {
        console.log('點擊訂單匯出按鈕');

        try {
            // 初始化上個月的開始和結束日期
            const lastMonth = getLastMonth();
            const startDate = `${lastMonth.year}-${lastMonth.monthStr}-01`;
            const lastDay = new Date(lastMonth.year, lastMonth.month, 0).getDate();
            const endDate = `${lastMonth.year}-${lastMonth.monthStr}-${lastDay.toString().padStart(2, '0')}`;

            showStatus('正在處理...', 'processing');

            // 將所有邏輯交給 background.js 處理
            const response = await chrome.runtime.sendMessage({
                action: 'orderExportTask',
                targetPath: '/admin/orders/reportion',
                startDate: startDate,
                endDate: endDate
            });

            if (response.success) {
                showStatus(response.message || '訂單匯出成功！', 'success');
            } else {
                showStatus(response.message || '執行失敗', 'error');
            }
        } catch (error) {
            console.error('執行錯誤:', error);
            showStatus('執行失敗，請重試', 'error');
        }
    });

    // 保存 webhook URL
    saveWebhookBtn.addEventListener('click', function() {
        const webhookUrl = webhookUrlInput.value.trim();

        if (!webhookUrl) {
            showStatus('請輸入 webhook URL', 'error');
            return;
        }

        // 驗證 URL 格式
        try {
            new URL(webhookUrl);
        } catch (e) {
            showStatus('請輸入有效的 URL', 'error');
            return;
        }

        // 保存到 Chrome storage
        chrome.storage.sync.set({ webhookUrl: webhookUrl }, function() {
            showStatus('Webhook URL 已保存！', 'success');
        });
    });

    // 截取流量按鈕
    const captureTrafficBtn = document.getElementById('captureTrafficBtn');
    captureTrafficBtn.addEventListener('click', async () => {
        console.log('點擊截取流量按鈕');

        try {
            // 初始化上個月的開始和結束日期
            const lastMonth = getLastMonth();
            const startDate = `${lastMonth.year}-${lastMonth.monthStr}-01`;
            const lastDay = new Date(lastMonth.year, lastMonth.month, 0).getDate();
            const endDate = `${lastMonth.year}-${lastMonth.monthStr}-${lastDay.toString().padStart(2, '0')}`;

            showStatus('正在處理...', 'processing');

            // 將所有邏輯交給 background.js 處理
            const response = await chrome.runtime.sendMessage({
                action: 'captureTrafficTask',
                targetPath: '/admin/business_intelligence/overview',
                startDate: startDate,
                endDate: endDate
            });

            if (response.success) {
                showStatus(`成功發送 ${response.totalRows} 筆資料！`, 'success');
            } else {
                showStatus(response.message || '執行失敗', 'error');
            }
        } catch (error) {
            console.error('執行錯誤:', error);
            showStatus('執行失敗，請重試', 'error');
        }
    });
});