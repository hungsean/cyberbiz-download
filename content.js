console.log('資料下載工具內容腳本已載入');

// 日期格式化函數
function formatDate(year, month, day = 1, hour = 0, minute = 0, second = 0) {
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const hourStr = hour.toString().padStart(2, '0');
    const minuteStr = minute.toString().padStart(2, '0');
    const secondStr = second.toString().padStart(2, '0');
    return `${year}-${monthStr}-${dayStr} ${hourStr}:${minuteStr}:${secondStr}`;
}

// 獲取月份的最後一天
function getLastDayOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

// 點擊確認 checkbox 的函數
function clickReadAndConfirmCheckbox() {
    try {
        const checkbox = document.getElementById('read_and_confirm');

        if (!checkbox) {
            throw new Error('找不到 read_and_confirm checkbox');
        }

        // 如果 checkbox 尚未被勾選，則點擊它
        if (!checkbox.checked) {
            checkbox.click();
            console.log('已勾選 read_and_confirm checkbox');
        } else {
            console.log('read_and_confirm checkbox 已經被勾選');
        }

        return {
            success: true,
            message: 'checkbox 操作完成',
            wasChecked: checkbox.checked
        };
    } catch (error) {
        console.error('點擊 checkbox 時發生錯誤:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 點擊導出報告按鈕的函數
function clickExportReportButton() {
    try {
        const exportButton = document.getElementById('export-report');

        if (!exportButton) {
            throw new Error('找不到 export-report 按鈕');
        }

        // 模擬點擊事件
        exportButton.click();

        console.log('已點擊 export-report 按鈕');

        return {
            success: true,
            message: '成功點擊導出按鈕'
        };
    } catch (error) {
        console.error('點擊導出按鈕時發生錯誤:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 設定日期範圍的主要函數
function setDateRange(year, month) {
    try {
        // 尋找日期選擇器元素
        const fromDateInput = document.getElementById('from_date');
        const thruDateInput = document.getElementById('thru_date');

        if (!fromDateInput || !thruDateInput) {
            throw new Error('找不到日期輸入欄位');
        }

        // 計算月份的開始和結束日期
        const startDate = formatDate(year, month, 1, 0, 0, 0);
        const lastDay = getLastDayOfMonth(year, month);
        const endDate = formatDate(year, month, lastDay, 23, 59, 59);

        // 設定日期值
        fromDateInput.value = startDate;
        thruDateInput.value = endDate;

        // 觸發 change 事件以確保頁面識別到變更
        const changeEvent = new Event('change', { bubbles: true });
        fromDateInput.dispatchEvent(changeEvent);
        thruDateInput.dispatchEvent(changeEvent);

        // 也嘗試觸發 input 事件
        const inputEvent = new Event('input', { bubbles: true });
        fromDateInput.dispatchEvent(inputEvent);
        thruDateInput.dispatchEvent(inputEvent);

        console.log(`已設定日期範圍: ${startDate} 到 ${endDate}`);

        return {
            success: true,
            fromDate: startDate,
            thruDate: endDate
        };
    } catch (error) {
        console.error('設定日期範圍時發生錯誤:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 驗證頁面上是否有必要的日期選擇器
function validateDatePickers() {
    const fromDateInput = document.getElementById('from_date');
    const thruDateInput = document.getElementById('thru_date');
    const datePickerElements = document.querySelectorAll('.datepicker');

    return {
        hasFromDate: !!fromDateInput,
        hasThruDate: !!thruDateInput,
        datePickerCount: datePickerElements.length,
        pageReady: !!(fromDateInput && thruDateInput)
    };
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log('內容腳本收到訊息:', request);

    if (request.action === 'downloadData') {
        console.log('在頁面中執行資料下載:', request.period);

        // 驗證頁面是否準備好
        const validation = validateDatePickers();
        console.log('頁面驗證結果:', validation);

        if (!validation.pageReady) {
            sendResponse({
                success: false,
                message: '頁面尚未準備好或缺少必要的日期選擇器'
            });
            return;
        }

        // 設定日期範圍
        const dateResult = setDateRange(request.year, request.month);

        if (dateResult.success) {
            // 設定完日期後，執行完整的自動化流程
            setTimeout(() => {
                // 先點擊導出按鈕
                const exportResult = clickExportReportButton();
                console.log('自動導出結果:', exportResult);

                // 再延遲一點時間點擊確認 checkbox
                setTimeout(() => {
                    const checkboxResult = clickReadAndConfirmCheckbox();
                    console.log('自動勾選 checkbox 結果:', checkboxResult);
                }, 1000); // 再延遲 1 秒
            }, 1000); // 延遲 1 秒

            sendResponse({
                success: true,
                message: `已在 ${window.location.hostname} 設定 ${request.period} 的日期範圍並自動執行導出與確認`,
                dateRange: {
                    from: dateResult.fromDate,
                    thru: dateResult.thruDate
                }
            });
        } else {
            sendResponse({
                success: false,
                message: `設定日期失敗: ${dateResult.error}`
            });
        }
    }

    // 處理單獨的導出報告請求
    if (request.action === 'exportReport') {
        console.log('執行導出報告');
        const exportResult = clickExportReportButton();

        sendResponse({
            success: exportResult.success,
            message: exportResult.success ? exportResult.message : `導出失敗: ${exportResult.error}`
        });
    }

    // 處理頁面驗證請求
    if (request.action === 'validatePage') {
        const validation = validateDatePickers();
        sendResponse(validation);
    }
});