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

// 點擊"我同意"確認按鈕的函數
function clickAgreeButton() {
    try {
        // 尋找所有 class="confirm" 的按鈕
        const confirmButtons = document.querySelectorAll('.confirm');
        let targetButton = null;

        // 遍歷找到內容是"我同意"的按鈕
        for (const button of confirmButtons) {
            if (button.textContent.trim() === '我同意') {
                targetButton = button;
                break;
            }
        }

        if (!targetButton) {
            throw new Error('找不到內容為"我同意"的 confirm 按鈕');
        }

        // 模擬點擊事件
        targetButton.click();

        console.log('已點擊"我同意"按鈕');

        return {
            success: true,
            message: '成功點擊"我同意"按鈕'
        };
    } catch (error) {
        console.error('點擊"我同意"按鈕時發生錯誤:', error);
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

// 等待 loading 消失的函數
function waitForLoadingToDisappear(timeout = 30000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkLoading = () => {
            const loadingElement = document.querySelector('.loading-block');

            // 如果找不到 loading 元素,或元素已隱藏
            if (!loadingElement ||
                loadingElement.style.display === 'none' ||
                !loadingElement.offsetParent) {
                console.log('Loading 已消失');
                resolve(true);
                return;
            }

            // 檢查是否超時
            if (Date.now() - startTime > timeout) {
                console.error('等待 loading 消失超時');
                reject(new Error('等待 loading 消失超時'));
                return;
            }

            // 繼續檢查 (每 200ms 檢查一次)
            setTimeout(checkLoading, 200);
        };

        checkLoading();
    });
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    console.log('內容腳本收到訊息:', request);

    // 處理等待 loading 的請求
    if (request.action === 'waitForLoading') {
        console.log('檢查並等待 loading 消失');

        (async () => {
            try {
                await waitForLoadingToDisappear();
                sendResponse({
                    success: true,
                    message: 'Loading 已消失或不存在'
                });
            } catch (error) {
                console.error('等待 loading 時發生錯誤:', error);
                sendResponse({
                    success: false,
                    message: `等待失敗: ${error.message}`
                });
            }
        })();

        return true; // 保持訊息通道開啟以進行非同步回應
    }

    // 設定訂單匯出的日期範圍
    if (request.action === 'setOrderDateRange') {
        console.log('設定訂單日期範圍:', request.startDate, '到', request.endDate);

        try {
            // 尋找日期選擇器元素
            const fromDateInput = document.getElementById('from_date');
            const thruDateInput = document.getElementById('thru_date');

            if (!fromDateInput || !thruDateInput) {
                sendResponse({
                    success: false,
                    message: '找不到日期輸入欄位'
                });
                return;
            }

            // 將 yyyy-mm-dd 格式轉換為 yyyy-mm-dd hh:mm:ss 格式
            const startDateTime = `${request.startDate} 00:00:00`;
            const endDateTime = `${request.endDate} 23:59:59`;

            // 設定日期值
            fromDateInput.value = startDateTime;
            thruDateInput.value = endDateTime;

            // 觸發事件
            const changeEvent = new Event('change', { bubbles: true });
            const inputEvent = new Event('input', { bubbles: true });
            fromDateInput.dispatchEvent(changeEvent);
            fromDateInput.dispatchEvent(inputEvent);
            thruDateInput.dispatchEvent(changeEvent);
            thruDateInput.dispatchEvent(inputEvent);

            console.log(`已設定日期範圍: ${startDateTime} 到 ${endDateTime}`);

            sendResponse({
                success: true,
                message: '日期範圍設定成功',
                startDate: startDateTime,
                endDate: endDateTime
            });
        } catch (error) {
            console.error('設定日期範圍時發生錯誤:', error);
            sendResponse({
                success: false,
                message: `設定日期失敗: ${error.message}`
            });
        }
    }

    // 點擊導出按鈕
    if (request.action === 'clickExportButton') {
        console.log('執行點擊導出按鈕');
        const exportResult = clickExportReportButton();
        sendResponse({
            success: exportResult.success,
            message: exportResult.success ? exportResult.message : `導出失敗: ${exportResult.error}`
        });
    }

    // 點擊確認 checkbox
    if (request.action === 'clickCheckbox') {
        console.log('執行勾選 checkbox');
        const checkboxResult = clickReadAndConfirmCheckbox();
        sendResponse({
            success: checkboxResult.success,
            message: checkboxResult.success ? checkboxResult.message : `勾選失敗: ${checkboxResult.error}`
        });
    }

    // 點擊我同意按鈕
    if (request.action === 'clickAgreeButton') {
        console.log('執行點擊我同意按鈕');
        const agreeResult = clickAgreeButton();
        sendResponse({
            success: agreeResult.success,
            message: agreeResult.success ? agreeResult.message : `點擊失敗: ${agreeResult.error}`
        });
    }

    // 舊的 downloadData action（保留以兼容舊版本）
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

                    // 最後點擊"我同意"按鈕
                    setTimeout(() => {
                        const agreeResult = clickAgreeButton();
                        console.log('自動點擊"我同意"按鈕結果:', agreeResult);
                    }, 500); // 再延遲 0.5 秒
                }, 1000); // 再延遲 1 秒
            }, 1000); // 延遲 1 秒

            sendResponse({
                success: true,
                message: `已在 ${window.location.hostname} 設定 ${request.period} 的日期範圍並自動執行完整流程`,
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

    // 處理頁面驗證請求
    if (request.action === 'validatePage') {
        const validation = validateDatePickers();
        sendResponse(validation);
    }

    // 處理設定日期範圍請求（用於截取流量功能）
    if (request.action === 'setDateRange') {
        console.log('設定日期範圍:', request.startDate, '到', request.endDate);

        (async () => {
            try {
                // 尋找 class="DateInput_input_1" 的輸入框
                const dateInputs = document.querySelectorAll('.DateInput_input_1');

                if (dateInputs.length < 2) {
                    sendResponse({
                        success: false,
                        message: `找不到足夠的日期輸入框（找到 ${dateInputs.length} 個，需要 2 個）`
                    });
                    return;
                }

                // 第一個是開始時間，第二個是結束時間
                const startInput = dateInputs[0];
                const endInput = dateInputs[1];

                // 先 focus 並設定開始時間
                startInput.focus();
                startInput.value = request.startDate;

                // 觸發開始時間的事件
                const startChangeEvent = new Event('change', { bubbles: true });
                const startInputEvent = new Event('input', { bubbles: true });
                startInput.dispatchEvent(startChangeEvent);
                startInput.dispatchEvent(startInputEvent);

                // 再 focus 並設定結束時間
                endInput.focus();
                endInput.value = request.endDate;

                // 觸發結束時間的事件
                const endChangeEvent = new Event('change', { bubbles: true });
                const endInputEvent = new Event('input', { bubbles: true });
                endInput.dispatchEvent(endChangeEvent);
                endInput.dispatchEvent(endInputEvent);

                console.log(`日期範圍已設定: ${request.startDate} 到 ${request.endDate}`);

                // 等待 loading 消失
                console.log('等待 loading 消失...');
                await waitForLoadingToDisappear();

                sendResponse({
                    success: true,
                    message: '日期範圍設定成功且資料已載入',
                    startDate: request.startDate,
                    endDate: request.endDate
                });
            } catch (error) {
                console.error('設定日期範圍時發生錯誤:', error);
                sendResponse({
                    success: false,
                    message: `設定日期失敗: ${error.message}`
                });
            }
        })();

        return true; // 保持訊息通道開啟以進行非同步回應
    }

    // 處理抓取網站數據請求
    if (request.action === 'captureTableData') {
        console.log('開始抓取表格數據');

        try {
            // 尋找 div.pitaya-table-2 下的 table
            const tableContainer = document.querySelector('.pitaya-table-2');

            if (!tableContainer) {
                sendResponse({
                    success: false,
                    message: '找不到 .pitaya-table-2 容器'
                });
                return;
            }

            const table = tableContainer.querySelector('table');

            if (!table) {
                sendResponse({
                    success: false,
                    message: '在 .pitaya-table-2 中找不到 table 元素'
                });
                return;
            }

            // 解析表格為 JSON
            const headers = [];
            const rows = [];

            // 取得表頭
            const headerCells = table.querySelectorAll('thead th');
            headerCells.forEach(cell => {
                headers.push(cell.textContent.trim());
            });

            // 取得資料列
            const bodyRows = table.querySelectorAll('tbody tr');
            bodyRows.forEach(row => {
                const rowData = {};
                const cells = row.querySelectorAll('td');

                cells.forEach((cell, index) => {
                    if (index < headers.length) {
                        rowData[headers[index]] = cell.textContent.trim();
                    }
                });

                rows.push(rowData);
            });

            const tableData = {
                headers: headers,
                rows: rows,
                totalRows: rows.length,
                capturedAt: new Date().toISOString(),
                url: window.location.href
            };

            console.log('表格數據抓取成功:', tableData);

            sendResponse({
                success: true,
                data: tableData,
                message: `成功抓取 ${rows.length} 筆資料`
            });

        } catch (error) {
            console.error('抓取表格數據時發生錯誤:', error);
            sendResponse({
                success: false,
                message: `抓取失敗: ${error.message}`
            });
        }
    }
});