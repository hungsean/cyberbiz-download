document.addEventListener('DOMContentLoaded', function() {
    const lastMonthBtn = document.getElementById('lastMonthBtn');
    const thisMonthBtn = document.getElementById('thisMonthBtn');
    const statusDiv = document.getElementById('status');

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
});