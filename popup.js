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

        setTimeout(() => {
            console.log(`執行上個月 (${lastMonth.displayName}) 的下載邏輯`);
            console.log('年份:', lastMonth.year);
            console.log('月份:', lastMonth.month);
            console.log('格式化月份:', lastMonth.monthStr);

            showStatus(`${lastMonth.displayName} 資料處理完成！`, 'success');
        }, 1000);
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

                // 跳轉到目標路徑，保留原domain
                const targetUrl = `${currentUrl.origin}/admin/orders/reportion`;
                await chrome.tabs.update(tab.id, {url: targetUrl});

                // 等待頁面載入後執行下載邏輯
                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'downloadData',
                        period: thisMonth.displayName,
                        year: thisMonth.year,
                        month: thisMonth.month
                    });
                    showStatus(`${thisMonth.displayName} 資料處理完成！`, 'success');
                }, 2000);
            } else {
                console.log('路徑正確，直接執行下載');
                chrome.tabs.sendMessage(tab.id, {
                    action: 'downloadData',
                    period: thisMonth.displayName,
                    year: thisMonth.year,
                    month: thisMonth.month
                });
                showStatus(`${thisMonth.displayName} 資料處理完成！`, 'success');
            }
        } catch (error) {
            console.error('執行錯誤:', error);
            showStatus('執行失敗，請重試', 'error');
        }
    });
});