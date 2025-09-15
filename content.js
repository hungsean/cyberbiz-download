console.log('資料下載工具內容腳本已載入');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('內容腳本收到訊息:', request);

    if (request.action === 'downloadData') {
        console.log('在頁面中執行資料下載:', request.period);

        sendResponse({
            success: true,
            message: `已在 ${window.location.hostname} 執行 ${request.period} 資料下載`
        });
    }
});