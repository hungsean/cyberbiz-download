chrome.runtime.onInstalled.addListener(() => {
    console.log('資料下載工具已安裝');
});

// 發送 webhook 的函數
async function sendWebhook(data) {
    try {
        // 從 storage 取得 webhook URL
        const result = await chrome.storage.sync.get(['webhookUrl']);
        const webhookUrl = result.webhookUrl;

        if (!webhookUrl) {
            console.error('未設定 webhook URL');
            return { success: false, message: '請先設定 webhook URL' };
        }

        // 發送 POST 請求
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log('Webhook 發送成功');
            return { success: true, message: 'Webhook 發送成功' };
        } else {
            console.error('Webhook 發送失敗:', response.status);
            return { success: false, message: `Webhook 發送失敗: ${response.status}` };
        }
    } catch (error) {
        console.error('發送 webhook 時發生錯誤:', error);
        return { success: false, message: `發送失敗: ${error.message}` };
    }
}

// 存儲待執行的任務
let pendingTasks = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到訊息:', request);

    if (request.action === 'downloadData') {
        console.log('執行資料下載:', request.period);
        sendResponse({success: true, message: `${request.period} 資料下載完成`});
    }

    if (request.action === 'sendWebhook') {
        console.log('呼叫 sendWebhook:', request.data);
        sendWebhook(request.data).then(result => {
            sendResponse(result);
        });
        return true; // 保持訊息通道開啟以進行非同步回應
    }

    if (request.action === 'navigateToPage') {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];

            // 如果有後續任務，先儲存
            if (request.pendingTask) {
                pendingTasks.set(tab.id, request.pendingTask);
                console.log('儲存待執行任務:', request.pendingTask);
            }

            chrome.tabs.update(tab.id, {url: request.targetUrl}, () => {
                sendResponse({success: true, message: '頁面切換完成'});
            });
        });
        return true;
    }

    if (request.action === 'waitForPageReady') {
        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            const tab = tabs[0];
            try {
                const isReady = await waitForPageReady(tab.id, request.maxRetries || 10);
                sendResponse({success: isReady, message: isReady ? '頁面準備完成' : '頁面準備超時'});
            } catch (error) {
                console.error('等待頁面準備時發生錯誤:', error);
                sendResponse({success: false, message: '檢查頁面狀態失敗'});
            }
        });
        return true;
    }

    // 截取流量任務的統一處理
    if (request.action === 'captureTrafficTask') {
        console.log('收到截取流量任務:', request);

        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            const tab = tabs[0];
            const currentUrl = new URL(tab.url);

            try {
                // 檢查路徑是否正確
                if (currentUrl.pathname !== request.targetPath) {
                    console.log('路徑不匹配，需要跳轉');

                    // 儲存待執行任務
                    const pendingTask = {
                        action: 'captureTrafficTask',
                        startDate: request.startDate,
                        endDate: request.endDate
                    };
                    pendingTasks.set(tab.id, pendingTask);

                    // 執行跳轉
                    const targetUrl = `${currentUrl.origin}${request.targetPath}`;
                    chrome.tabs.update(tab.id, {url: targetUrl});

                    sendResponse({success: true, message: '頁面跳轉中，將自動執行'});
                } else {
                    console.log('路徑正確，直接執行截取流量');

                    // 執行完整的截取流量流程
                    const result = await executeCaptureTraffic(tab.id, request.startDate, request.endDate);
                    sendResponse(result);
                }
            } catch (error) {
                console.error('截取流量任務執行錯誤:', error);
                sendResponse({success: false, message: `執行失敗: ${error.message}`});
            }
        });

        return true; // 保持訊息通道開啟以進行非同步回應
    }

    // 直接發送流量任務 (簡化版)
    if (request.action === 'captureAndSendTask') {
        console.log('收到直接發送流量任務');

        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            const tab = tabs[0];

            try {
                // 直接執行簡化的截取流量流程
                const result = await executeCaptureAndSend(tab.id);
                sendResponse(result);
            } catch (error) {
                console.error('直接發送流量任務執行錯誤:', error);
                sendResponse({success: false, message: `執行失敗: ${error.message}`});
            }
        });

        return true; // 保持訊息通道開啟以進行非同步回應
    }

    // 訂單匯出任務的統一處理
    if (request.action === 'orderExportTask') {
        console.log('收到訂單匯出任務:', request);

        chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
            const tab = tabs[0];
            const currentUrl = new URL(tab.url);

            try {
                // 檢查路徑是否正確
                if (currentUrl.pathname !== request.targetPath) {
                    console.log('路徑不匹配，需要跳轉');

                    // 儲存待執行任務
                    const pendingTask = {
                        action: 'orderExportTask',
                        startDate: request.startDate,
                        endDate: request.endDate
                    };
                    pendingTasks.set(tab.id, pendingTask);

                    // 執行跳轉
                    const targetUrl = `${currentUrl.origin}${request.targetPath}`;
                    chrome.tabs.update(tab.id, {url: targetUrl});

                    sendResponse({success: true, message: '頁面跳轉中，將自動執行'});
                } else {
                    console.log('路徑正確，直接執行訂單匯出');

                    // 執行完整的訂單匯出流程
                    const result = await executeOrderExport(tab.id, request.startDate, request.endDate);
                    sendResponse(result);
                }
            } catch (error) {
                console.error('訂單匯出任務執行錯誤:', error);
                sendResponse({success: false, message: `執行失敗: ${error.message}`});
            }
        });

        return true; // 保持訊息通道開啟以進行非同步回應
    }
});

// 執行截取流量的完整流程
async function executeCaptureTraffic(tabId, startDate, endDate) {
    try {
        console.log('開始執行截取流量流程');

        // 1. 等待 loading
        console.log('步驟 1: 等待 loading 消失');
        const loadingResponse1 = await chrome.tabs.sendMessage(tabId, {
            action: 'waitForLoading'
        });
        if (!loadingResponse1.success) {
            return {success: false, message: '等待 loading 失敗'};
        }

        // 2. 設定日期
        console.log('步驟 2: 設定日期範圍');
        const dateResponse = await chrome.tabs.sendMessage(tabId, {
            action: 'setDateRange',
            startDate: startDate,
            endDate: endDate
        });
        if (!dateResponse.success) {
            return {success: false, message: `設定日期失敗: ${dateResponse.message}`};
        }

        // 3. 再次等待 loading（資料載入）
        console.log('步驟 3: 等待資料載入');
        const loadingResponse2 = await chrome.tabs.sendMessage(tabId, {
            action: 'waitForLoading'
        });
        if (!loadingResponse2.success) {
            return {success: false, message: '等待資料載入失敗'};
        }

        // 4. 抓取表格數據
        console.log('步驟 4: 抓取表格數據');
        const captureResponse = await chrome.tabs.sendMessage(tabId, {
            action: 'captureTableData'
        });
        if (!captureResponse.success) {
            return {success: false, message: `抓取數據失敗: ${captureResponse.message}`};
        }

        // 5. 清理數據（過濾出日期範圍內的資料）
        console.log('步驟 5: 清理數據');
        const allRows = captureResponse.data.rows;
        const filteredRows = allRows.filter(row => {
            const rowDate = row['日期'];
            if (!rowDate) return false;
            return rowDate >= startDate && rowDate <= endDate;
        });

        const filteredData = {
            ...captureResponse.data,
            rows: filteredRows,
            totalRows: filteredRows.length,
            originalTotalRows: allRows.length,
            dateRange: {startDate, endDate}
        };

        console.log(`數據清理完成：原始 ${allRows.length} 筆，過濾後 ${filteredRows.length} 筆`);

        // 6. 發送 webhook
        console.log('步驟 6: 發送 webhook');
        const webhookResponse = await sendWebhook(filteredData);
        if (!webhookResponse.success) {
            return {success: false, message: `發送 webhook 失敗: ${webhookResponse.message}`};
        }

        console.log('截取流量流程完成');

        // 儲存結果到 storage，供 popup 顯示
        const result = {
            success: true,
            totalRows: filteredRows.length,
            originalRows: allRows.length,
            dateRange: {startDate, endDate},
            message: `成功發送 ${filteredRows.length} 筆資料！`,
            messageType: 'success',
            details: `原始資料: ${allRows.length} 筆\n過濾後資料: ${filteredRows.length} 筆\n日期範圍: ${startDate} ~ ${endDate}`,
            timestamp: new Date().toISOString()
        };

        await chrome.storage.local.set({ lastTaskResult: result });

        // 嘗試打開 popup 顯示結果
        try {
            await chrome.action.openPopup();
            console.log('Popup 已打開');
        } catch (error) {
            console.log('無法打開 popup:', error.message);
            // 如果無法打開 popup（例如在某些情況下），結果仍然已儲存
        }

        return result;

    } catch (error) {
        console.error('執行截取流量流程時發生錯誤:', error);

        // 儲存錯誤結果
        const errorResult = {
            success: false,
            message: `執行失敗: ${error.message}`,
            messageType: 'error',
            details: error.stack || error.message,
            timestamp: new Date().toISOString()
        };

        await chrome.storage.local.set({ lastTaskResult: errorResult });

        // 嘗試打開 popup 顯示錯誤
        try {
            await chrome.action.openPopup();
        } catch (openError) {
            console.log('無法打開 popup:', openError.message);
        }

        return errorResult;
    }
}

// 執行訂單匯出的完整流程
async function executeOrderExport(tabId, startDate, endDate) {
    try {
        console.log('開始執行訂單匯出流程');

        // 1. 點擊 move-all-to-right 按鈕
        console.log('步驟 1: 點擊 move-all-to-right 按鈕');
        const moveResponse = await chrome.tabs.sendMessage(tabId, {
            action: 'clickMoveAllToRight'
        });
        if (!moveResponse.success) {
            return {success: false, message: `點擊 move-all-to-right 按鈕失敗: ${moveResponse.message}`};
        }

        // 2. 設定日期範圍
        console.log('步驟 2: 設定日期範圍');
        const dateResponse = await chrome.tabs.sendMessage(tabId, {
            action: 'setOrderDateRange',
            startDate: startDate,
            endDate: endDate
        });
        if (!dateResponse.success) {
            return {success: false, message: `設定日期失敗: ${dateResponse.message}`};
        }

        // 3. 點擊導出按鈕
        console.log('步驟 3: 點擊導出按鈕');
        const exportResponse = await chrome.tabs.sendMessage(tabId, {
            action: 'clickExportButton'
        });
        if (!exportResponse.success) {
            return {success: false, message: `點擊導出按鈕失敗: ${exportResponse.message}`};
        }

        // 4. 等待彈窗並勾選 checkbox
        console.log('步驟 4: 勾選確認 checkbox');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const checkboxResponse = await chrome.tabs.sendMessage(tabId, {
            action: 'clickCheckbox'
        });
        if (!checkboxResponse.success) {
            return {success: false, message: `勾選 checkbox 失敗: ${checkboxResponse.message}`};
        }

        // 5. 點擊我同意按鈕
        console.log('步驟 5: 點擊我同意按鈕');
        await new Promise(resolve => setTimeout(resolve, 500));
        const agreeResponse = await chrome.tabs.sendMessage(tabId, {
            action: 'clickAgreeButton'
        });
        if (!agreeResponse.success) {
            return {success: false, message: `點擊我同意按鈕失敗: ${agreeResponse.message}`};
        }

        console.log('訂單匯出流程完成');

        // 儲存結果到 storage，供 popup 顯示
        const result = {
            success: true,
            message: `訂單匯出成功！`,
            messageType: 'success',
            details: `日期範圍: ${startDate} ~ ${endDate}\n檔案已下載`,
            timestamp: new Date().toISOString()
        };

        await chrome.storage.local.set({ lastTaskResult: result });

        // 嘗試打開 popup 顯示結果
        try {
            await chrome.action.openPopup();
            console.log('Popup 已打開');
        } catch (error) {
            console.log('無法打開 popup:', error.message);
        }

        return result;

    } catch (error) {
        console.error('執行訂單匯出流程時發生錯誤:', error);

        // 儲存錯誤結果
        const errorResult = {
            success: false,
            message: `執行失敗: ${error.message}`,
            messageType: 'error',
            details: error.stack || error.message,
            timestamp: new Date().toISOString()
        };

        await chrome.storage.local.set({ lastTaskResult: errorResult });

        // 嘗試打開 popup 顯示錯誤
        try {
            await chrome.action.openPopup();
        } catch (openError) {
            console.log('無法打開 popup:', openError.message);
        }

        return errorResult;
    }
}

// 監聽頁面載入完成事件
chrome.webNavigation.onCompleted.addListener((details) => {
    // 只處理主頁面，不是 iframe
    if (details.frameId === 0) {
        console.log('頁面載入完成:', details.url);

        // 檢查是否有待執行的任務
        const pendingTask = pendingTasks.get(details.tabId);
        if (pendingTask) {
            console.log('發現待執行任務，準備執行:', pendingTask);

            // 延遲一下讓頁面完全渲染
            setTimeout(async () => {
                try {
                    // 判斷任務類型
                    if (pendingTask.action === 'captureTrafficTask') {
                        // 截取流量任務
                        console.log('執行截取流量任務');
                        await executeCaptureTraffic(details.tabId, pendingTask.startDate, pendingTask.endDate);
                        pendingTasks.delete(details.tabId);
                    } else if (pendingTask.action === 'orderExportTask') {
                        // 訂單匯出任務
                        console.log('執行訂單匯出任務');
                        await executeOrderExport(details.tabId, pendingTask.startDate, pendingTask.endDate);
                        pendingTasks.delete(details.tabId);
                    } else {
                        // 其他任務（如 downloadData）
                        const isReady = await waitForPageReady(details.tabId, 5);
                        if (isReady) {
                            console.log('頁面準備完成，執行待執行任務');
                            chrome.tabs.sendMessage(details.tabId, pendingTask);
                            pendingTasks.delete(details.tabId);
                        } else {
                            console.log('頁面未準備好，任務執行失敗');
                        }
                    }
                } catch (error) {
                    console.error('執行待執行任務時發生錯誤:', error);
                }
            }, 1500);
        }
    }
});

// 檢查頁面是否準備好的函數
async function waitForPageReady(tabId, maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            // 先檢查頁面是否有必要元素（針對 downloadData 的情況）
            const validateResponse = await chrome.tabs.sendMessage(tabId, {action: 'validatePage'});
            if (validateResponse && validateResponse.pageReady) {
                console.log(`頁面準備完成 (嘗試 ${i + 1}/${maxRetries})`);
                return true;
            }

            // 如果沒有 validatePage 回應，嘗試等待 loading（針對 captureTraffic 的情況）
            const loadingResponse = await chrome.tabs.sendMessage(tabId, {action: 'waitForLoading'});
            if (loadingResponse && loadingResponse.success) {
                console.log(`Loading 等待完成 (嘗試 ${i + 1}/${maxRetries})`);
                return true;
            }
        } catch (error) {
            console.log(`檢查頁面狀態失敗 (嘗試 ${i + 1}/${maxRetries}):`, error.message);
        }

        // 等待 500ms 再次嘗試
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`頁面準備檢查超時 (${maxRetries} 次嘗試)`);
    return false;
}

// 執行直接發送流量的簡化流程
async function executeCaptureAndSend(tabId) {
    try {
        console.log('開始執行直接發送流量流程');

        // 1. 等待 loading (如果有的話)
        console.log('步驟 1: 等待 loading 消失');
        try {
            await chrome.tabs.sendMessage(tabId, {
                action: 'waitForLoading'
            });
        } catch (error) {
            console.log('沒有 loading 或已消失，繼續執行');
        }

        // 2. 直接抓取表格數據
        console.log('步驟 2: 抓取表格數據');
        const captureResponse = await chrome.tabs.sendMessage(tabId, {
            action: 'captureTableData'
        });
        if (!captureResponse.success) {
            return {success: false, message: `抓取數據失敗: ${captureResponse.message}`};
        }

        // 3. 檢查資料是否都是同一個月
        console.log('步驟 3: 檢查資料是否都是同一個月');
        const allRows = captureResponse.data.rows;

        if (allRows.length === 0) {
            return {success: false, message: '沒有資料可發送'};
        }

        // 取得第一筆資料的年月
        const firstDate = allRows[0]['日期'];
        if (!firstDate) {
            return {success: false, message: '資料格式錯誤：找不到日期欄位'};
        }

        const [year, month] = firstDate.split('-').slice(0, 2);
        const targetYearMonth = `${year}-${month}`;

        // 過濾出同一個月的資料
        const filteredRows = allRows.filter(row => {
            const rowDate = row['日期'];
            if (!rowDate) return false;
            return rowDate.startsWith(targetYearMonth);
        });

        console.log(`資料檢查完成：原始 ${allRows.length} 筆，同月份 ${filteredRows.length} 筆 (${targetYearMonth})`);

        // 如果過濾後沒有資料，表示資料不統一
        if (filteredRows.length === 0) {
            return {success: false, message: '資料月份不一致，無法發送'};
        }

        // 準備發送的數據
        const dataToSend = {
            ...captureResponse.data,
            rows: filteredRows,
            totalRows: filteredRows.length,
            originalTotalRows: allRows.length,
            yearMonth: targetYearMonth
        };

        // 4. 發送 webhook
        console.log('步驟 4: 發送 webhook');
        const webhookResponse = await sendWebhook(dataToSend);
        if (!webhookResponse.success) {
            return {success: false, message: `發送 webhook 失敗: ${webhookResponse.message}`};
        }

        console.log('直接發送流量流程完成');

        // 儲存結果到 storage，供 popup 顯示
        const result = {
            success: true,
            totalRows: filteredRows.length,
            originalRows: allRows.length,
            yearMonth: targetYearMonth,
            message: `成功發送 ${filteredRows.length} 筆資料！(${targetYearMonth})`,
            messageType: 'success',
            details: `原始資料: ${allRows.length} 筆\n同月份資料: ${filteredRows.length} 筆\n月份: ${targetYearMonth}`,
            timestamp: new Date().toISOString()
        };

        await chrome.storage.local.set({ lastTaskResult: result });

        // 嘗試打開 popup 顯示結果
        try {
            await chrome.action.openPopup();
            console.log('Popup 已打開');
        } catch (error) {
            console.log('無法打開 popup:', error.message);
        }

        return result;

    } catch (error) {
        console.error('執行直接發送流量流程時發生錯誤:', error);

        // 儲存錯誤結果
        const errorResult = {
            success: false,
            message: `執行失敗: ${error.message}`,
            messageType: 'error',
            details: error.stack || error.message,
            timestamp: new Date().toISOString()
        };

        await chrome.storage.local.set({ lastTaskResult: errorResult });

        // 嘗試打開 popup 顯示錯誤
        try {
            await chrome.action.openPopup();
        } catch (openError) {
            console.log('無法打開 popup:', openError.message);
        }

        return errorResult;
    }
}

chrome.action.onClicked.addListener((tab) => {
    console.log('擴充功能圖示被點擊');
});