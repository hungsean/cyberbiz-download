document.addEventListener('DOMContentLoaded', function() {
    const actionBtn = document.getElementById('actionBtn');
    const getInfoBtn = document.getElementById('getInfoBtn');
    const statusDiv = document.getElementById('status');
    const pageInfoDiv = document.getElementById('pageInfo');

    actionBtn.addEventListener('click', async () => {
        statusDiv.textContent = '執行中...';
        statusDiv.className = 'status-message processing';

        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

            chrome.tabs.sendMessage(tab.id, {action: 'performAction'}, (response) => {
                if (chrome.runtime.lastError) {
                    statusDiv.textContent = '錯誤: ' + chrome.runtime.lastError.message;
                    statusDiv.className = 'status-message error';
                } else if (response && response.success) {
                    statusDiv.textContent = '動作執行成功!';
                    statusDiv.className = 'status-message success';
                } else {
                    statusDiv.textContent = '動作執行失敗';
                    statusDiv.className = 'status-message error';
                }
            });
        } catch (error) {
            statusDiv.textContent = '發生錯誤: ' + error.message;
            statusDiv.className = 'status-message error';
        }
    });

    getInfoBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

            chrome.tabs.sendMessage(tab.id, {action: 'getPageInfo'}, (response) => {
                if (chrome.runtime.lastError) {
                    pageInfoDiv.innerHTML = `<p class="error">無法取得頁面資訊</p>`;
                } else if (response) {
                    pageInfoDiv.innerHTML = `
                        <p><strong>標題:</strong> ${response.title}</p>
                        <p><strong>URL:</strong> <span class="url">${response.url}</span></p>
                        <p><strong>網域:</strong> ${response.domain}</p>
                        <p><strong>元素數量:</strong> ${response.elementCount}</p>
                    `;
                }
            });
        } catch (error) {
            pageInfoDiv.innerHTML = `<p class="error">發生錯誤: ${error.message}</p>`;
        }
    });

    chrome.storage.local.get(['visitCount'], (result) => {
        const count = result.visitCount || 0;
        const footer = document.createElement('div');
        footer.className = 'footer';
        footer.innerHTML = `<p>擴充功能已使用 ${count} 次</p>`;
        document.querySelector('.container').appendChild(footer);
    });
});