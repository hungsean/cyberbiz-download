chrome.runtime.onInstalled.addListener(() => {
    console.log('資料下載工具已安裝');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到訊息:', request);

    if (request.action === 'downloadData') {
        console.log('執行資料下載:', request.period);
        sendResponse({success: true, message: `${request.period} 資料下載完成`});
    }

    if (request.action === 'navigateToPage') {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tab = tabs[0];
            chrome.tabs.update(tab.id, {url: request.targetUrl}, () => {
                sendResponse({success: true, message: '頁面切換完成'});
            });
        });
        return true; // 保持訊息通道開啟以進行非同步回應
    }
});

chrome.action.onClicked.addListener((tab) => {
    console.log('擴充功能圖示被點擊');
});