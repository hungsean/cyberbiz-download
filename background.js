chrome.runtime.onInstalled.addListener(() => {
    console.log('擴充功能已安裝');

    chrome.storage.local.set({visitCount: 0}, () => {
        console.log('初始化訪問計數器');
    });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.storage.local.get(['visitCount'], (result) => {
        const newCount = (result.visitCount || 0) + 1;
        chrome.storage.local.set({visitCount: newCount});
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到來自內容腳本的訊息:', request);

    if (request.action === 'logMessage') {
        console.log('來自頁面的訊息:', request.message);
        sendResponse({received: true});
    }

    if (request.action === 'saveData') {
        chrome.storage.local.set({pageData: request.data}, () => {
            sendResponse({success: true});
        });
        return true;
    }

    if (request.action === 'getData') {
        chrome.storage.local.get(['pageData'], (result) => {
            sendResponse({data: result.pageData});
        });
        return true;
    }
});

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, {action: 'toggleFeature'});
});

chrome.contextMenus.create({
    id: "myExtensionMenu",
    title: "我的擴充功能選項",
    contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "myExtensionMenu") {
        const selectedText = info.selectionText;
        chrome.tabs.sendMessage(tab.id, {
            action: 'processSelection',
            text: selectedText
        });
    }
});

chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.frameId === 0) {
        console.log('頁面載入完成:', details.url);
    }
});