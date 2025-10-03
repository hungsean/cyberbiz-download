document.addEventListener('DOMContentLoaded', function() {
    const lastMonthBtn = document.getElementById('lastMonthBtn');
    const thisMonthBtn = document.getElementById('thisMonthBtn');
    const statusDiv = document.getElementById('status');
    const webhookUrlInput = document.getElementById('webhookUrl');
    const saveWebhookBtn = document.getElementById('saveWebhookBtn');

    // 載入已保存的 webhook URL
    chrome.storage.sync.get(['webhookUrl'], function(result) {
        if (result.webhookUrl) {
            webhookUrlInput.value = result.webhookUrl;
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

    function getThisMonth() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
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

    lastMonthBtn.addEventListener('click', async () => {
        const lastMonth = getLastMonth();
        console.log('點擊上個月按鈕', lastMonth);

        showStatus(`準備下載 ${lastMonth.displayName} 的資料...`, 'processing');

        try {
            // 獲取當前活動分頁
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const currentUrl = new URL(tab.url);

            // 檢查路徑是否正確
            const targetPath = '/admin/orders/reportion'; // 修改為您需要的路徑

            if (currentUrl.pathname !== targetPath) {
                console.log('路徑不匹配，當前路徑:', currentUrl.pathname, '目標路徑:', targetPath);
                showStatus('跳轉到正確頁面...', 'processing');

                // 透過 background script 跳轉到目標路徑，並設定待執行任務
                const targetUrl = `${currentUrl.origin}/admin/orders/reportion`;
                const pendingTask = {
                    action: 'downloadData',
                    period: lastMonth.displayName,
                    year: lastMonth.year,
                    month: lastMonth.month
                };

                const response = await chrome.runtime.sendMessage({
                    action: 'navigateToPage',
                    targetUrl: targetUrl,
                    pendingTask: pendingTask
                });

                if (response.success) {
                    showStatus('頁面切換完成，正在等待頁面載入...', 'processing');

                    // 等待頁面準備完成
                    const readyResponse = await chrome.runtime.sendMessage({
                        action: 'waitForPageReady',
                        maxRetries: 15
                    });

                    if (readyResponse.success) {
                        showStatus('自動執行完成！', 'success');
                    } else {
                        showStatus('頁面載入超時，請手動執行', 'error');
                    }
                }
                return; // 跳轉情況下，不繼續執行下面的程式碼
            }

            console.log('路徑正確，直接執行下載');
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'downloadData',
                period: lastMonth.displayName,
                year: lastMonth.year,
                month: lastMonth.month
            });

            if (response.success) {
                const message = response.dateRange
                    ? `${lastMonth.displayName} 日期已設定 (${response.dateRange.from} 到 ${response.dateRange.thru})`
                    : `${lastMonth.displayName} 資料處理完成！`;
                showStatus(message, 'success');
            } else {
                showStatus(response.message || '執行失敗', 'error');
            }

        } catch (error) {
            console.error('執行錯誤:', error);
            showStatus('執行失敗，請重試', 'error');
        }
    });

    thisMonthBtn.addEventListener('click', async () => {
        const thisMonth = getThisMonth();
        console.log('點擊本月按鈕', thisMonth);

        showStatus(`準備下載 ${thisMonth.displayName} 的資料...`, 'processing');

        try {
            // 獲取當前活動分頁
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const currentUrl = new URL(tab.url);

            // 檢查路徑是否正確
            const targetPath = '/admin/orders/reportion'; // 修改為您需要的路徑

            if (currentUrl.pathname !== targetPath) {
                console.log('路徑不匹配，當前路徑:', currentUrl.pathname, '目標路徑:', targetPath);
                showStatus('跳轉到正確頁面...', 'processing');

                // 透過 background script 跳轉到目標路徑，並設定待執行任務
                const targetUrl = `${currentUrl.origin}/admin/orders/reportion`;
                const pendingTask = {
                    action: 'downloadData',
                    period: thisMonth.displayName,
                    year: thisMonth.year,
                    month: thisMonth.month
                };

                const response = await chrome.runtime.sendMessage({
                    action: 'navigateToPage',
                    targetUrl: targetUrl,
                    pendingTask: pendingTask
                });

                if (response.success) {
                    showStatus('頁面切換完成，正在等待頁面載入...', 'processing');

                    // 等待頁面準備完成
                    const readyResponse = await chrome.runtime.sendMessage({
                        action: 'waitForPageReady',
                        maxRetries: 15
                    });

                    if (readyResponse.success) {
                        showStatus('自動執行完成！', 'success');
                    } else {
                        showStatus('頁面載入超時，請手動執行', 'error');
                    }
                }
                return; // 跳轉情況下，不繼續執行下面的程式碼
            }

            console.log('路徑正確，直接執行下載');
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'downloadData',
                period: thisMonth.displayName,
                year: thisMonth.year,
                month: thisMonth.month
            });

            if (response.success) {
                const message = response.dateRange
                    ? `${thisMonth.displayName} 日期已設定 (${response.dateRange.from} 到 ${response.dateRange.thru})`
                    : `${thisMonth.displayName} 資料處理完成！`;
                showStatus(message, 'success');
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

    // 1. 函數：輸入年份和月份，輸出該月的開始和結束日期（yyyy-mm-dd格式）
    function getMonthDateRange(year, month) {
        // 該月的第一天
        const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`;

        // 該月的最後一天：下個月的第0天 = 這個月的最後一天
        const lastDay = new Date(year, month, 0);
        const lastDayStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.getDate().toString().padStart(2, '0')}`;

        return {
            startDate: firstDay,
            endDate: lastDayStr
        };
    }

    // 2. 函數：設定日期範圍到頁面上的輸入框
    async function setDateRangeOnPage(year, month) {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const dateRange = getMonthDateRange(year, month);

            try {
                // 透過 content script 設定日期
                const response = await chrome.tabs.sendMessage(tab.id, {
                    action: 'setDateRange',
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate
                });

                console.log('Content script 回應:', response);
                return response;
            } catch (error) {
                // 如果連接失敗，嘗試注入 content script
                if (error.message.includes('Could not establish connection')) {
                    console.log('Content script 未載入，嘗試注入...');

                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content.js']
                        });

                        // 等待一下讓 content script 初始化
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // 重新嘗試發送訊息
                        const response = await chrome.tabs.sendMessage(tab.id, {
                            action: 'setDateRange',
                            startDate: dateRange.startDate,
                            endDate: dateRange.endDate
                        });

                        return response;
                    } catch (injectError) {
                        console.error('注入 content script 失敗:', injectError);
                        throw new Error('無法載入必要的腳本，請重新整理頁面後再試');
                    }
                }
                throw error;
            }
        } catch (error) {
            console.error('設定日期範圍錯誤:', error);
            throw error;
        }
    }

    // 截取流量按鈕
    const captureTrafficBtn = document.getElementById('captureTrafficBtn');
    captureTrafficBtn.addEventListener('click', async () => {
        console.log('點擊截取流量按鈕');

        try {
            // 3-1. 確認目前 URL 是否正確
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const currentUrl = new URL(tab.url);
            const targetPath = '/admin/business_intelligence/overview';

            // 如果路徑不對，導航到正確頁面
            if (currentUrl.pathname !== targetPath) {
                console.log('路徑不匹配，當前路徑:', currentUrl.pathname, '目標路徑:', targetPath);
                showStatus('跳轉到正確頁面...', 'processing');

                // 透過 background script 跳轉到目標路徑，並設定待執行任務
                const targetUrl = `${currentUrl.origin}${targetPath}`;
                const lastMonth = getLastMonth();
                const pendingTask = {
                    action: 'captureTraffic',
                    period: lastMonth.displayName,
                    year: lastMonth.year,
                    month: lastMonth.month
                };

                const response = await chrome.runtime.sendMessage({
                    action: 'navigateToPage',
                    targetUrl: targetUrl,
                    pendingTask: pendingTask
                });

                if (response.success) {
                    showStatus('頁面切換完成，正在等待頁面載入...', 'processing');

                    // 等待頁面準備完成
                    const readyResponse = await chrome.runtime.sendMessage({
                        action: 'waitForPageReady',
                        maxRetries: 15
                    });

                    if (readyResponse.success) {
                        showStatus('自動執行完成！', 'success');
                    } else {
                        showStatus('頁面載入超時，請手動執行', 'error');
                    }
                }
                return; // 跳轉情況下，不繼續執行下面的程式碼
            }

            // 路徑正確，先確認是否在 loading 畫面
            console.log('路徑正確，檢查 loading 狀態');
            const loadingCheckResponse = await chrome.tabs.sendMessage(tab.id, {
                action: 'waitForLoading'
            });

            if (!loadingCheckResponse.success) {
                showStatus('等待載入失敗', 'error');
                return;
            }

            // 3-2. 設定日期（使用上個月）
            showStatus('正在設定日期範圍...', 'processing');
            const lastMonth = getLastMonth();
            const dateResponse = await setDateRangeOnPage(lastMonth.year, lastMonth.month);

            if (!dateResponse.success) {
                showStatus('設定日期失敗：' + dateResponse.message, 'error');
                return;
            }

            console.log('日期設定成功:', dateResponse);
            showStatus('資料載入完成，正在抓取表格數據...', 'processing');

            // 3-3. 抓取表格數據
            const captureResponse = await chrome.tabs.sendMessage(tab.id, {
                action: 'captureTableData'
            });

            if (!captureResponse.success) {
                showStatus('抓取數據失敗：' + captureResponse.message, 'error');
                return;
            }

            console.log('抓取到的數據:', captureResponse.data);
            showStatus('數據抓取成功，正在過濾資料...', 'processing');

            // 3-3.5. 過濾資料：只保留在當前月份範圍內的資料
            const dateRange = getMonthDateRange(lastMonth.year, lastMonth.month);
            const filteredRows = captureResponse.data.rows.filter(row => {
                const rowDate = row['日期']; // 假設欄位名稱為「日期」
                if (!rowDate) return false;

                // 將日期字串轉為可比較的格式 (假設格式為 yyyy-mm-dd 或類似)
                return rowDate >= dateRange.startDate && rowDate <= dateRange.endDate;
            });

            const filteredData = {
                ...captureResponse.data,
                rows: filteredRows,
                totalRows: filteredRows.length,
                originalTotalRows: captureResponse.data.totalRows,
                dateRange: dateRange
            };

            console.log(`過濾完成：原始 ${captureResponse.data.totalRows} 筆，過濾後 ${filteredRows.length} 筆`);
            showStatus('資料過濾完成，正在發送到 webhook...', 'processing');

            // 3-4. 發送 JSON 數據到 webhook
            const webhookResponse = await chrome.runtime.sendMessage({
                action: 'sendWebhook',
                data: filteredData
            });

            if (webhookResponse.success) {
                showStatus(`成功發送 ${filteredRows.length} 筆資料！`, 'success');
            } else {
                showStatus(webhookResponse.message || '發送失敗', 'error');
            }
        } catch (error) {
            console.error('執行錯誤:', error);
            showStatus('執行失敗，請重試', 'error');
        }
    });
});