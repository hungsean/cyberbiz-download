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
});

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
                    const isReady = await waitForPageReady(details.tabId, 5);
                    if (isReady) {
                        console.log('頁面準備完成，執行待執行任務');
                        chrome.tabs.sendMessage(details.tabId, pendingTask);
                        pendingTasks.delete(details.tabId);
                    } else {
                        console.log('頁面未準備好，任務執行失敗');
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
            const response = await chrome.tabs.sendMessage(tabId, {action: 'validatePage'});
            if (response && response.pageReady) {
                console.log(`頁面準備完成 (嘗試 ${i + 1}/${maxRetries})`);
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

chrome.action.onClicked.addListener((tab) => {
    console.log('擴充功能圖示被點擊');
});