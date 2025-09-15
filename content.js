console.log('內容腳本已載入到頁面');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到訊息:', request);

    if (request.action === 'performAction') {
        const result = performCustomAction();
        sendResponse({success: true, result: result});
    }

    if (request.action === 'getPageInfo') {
        const pageInfo = {
            title: document.title,
            url: window.location.href,
            domain: window.location.hostname,
            elementCount: document.querySelectorAll('*').length
        };
        sendResponse(pageInfo);
    }

    if (request.action === 'toggleFeature') {
        togglePageFeature();
        sendResponse({success: true});
    }

    if (request.action === 'processSelection') {
        processSelectedText(request.text);
        sendResponse({success: true});
    }
});

function performCustomAction() {
    console.log('執行自定義動作');

    const headerElement = document.querySelector('h1');
    if (headerElement) {
        headerElement.style.backgroundColor = '#ffeb3b';
        headerElement.style.padding = '10px';
        headerElement.style.transition = 'all 0.3s ease';
    }

    const allLinks = document.querySelectorAll('a');
    allLinks.forEach((link, index) => {
        if (index < 5) {
            link.style.color = '#ff5722';
            link.style.fontWeight = 'bold';
        }
    });

    return {
        modified: true,
        elementsChanged: Math.min(allLinks.length, 5) + (headerElement ? 1 : 0)
    };
}

function togglePageFeature() {
    const overlay = document.getElementById('my-extension-overlay');

    if (overlay) {
        overlay.remove();
    } else {
        const newOverlay = document.createElement('div');
        newOverlay.id = 'my-extension-overlay';
        newOverlay.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            font-family: Arial, sans-serif;
            max-width: 300px;
        `;
        newOverlay.innerHTML = `
            <h3 style="margin: 0 0 10px 0;">擴充功能啟用中</h3>
            <p style="margin: 0;">正在監控此頁面的活動</p>
            <button id="close-overlay" style="
                margin-top: 10px;
                padding: 5px 10px;
                background: white;
                color: #667eea;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">關閉</button>
        `;
        document.body.appendChild(newOverlay);

        document.getElementById('close-overlay').addEventListener('click', () => {
            newOverlay.remove();
        });
    }
}

function processSelectedText(text) {
    console.log('處理選取的文字:', text);

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 250px;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
        <strong>已選取文字:</strong><br>
        ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}
    `;

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);

    chrome.runtime.sendMessage({
        action: 'saveData',
        data: {
            selectedText: text,
            timestamp: new Date().toISOString(),
            url: window.location.href
        }
    });
}

window.addEventListener('load', () => {
    chrome.runtime.sendMessage({
        action: 'logMessage',
        message: `頁面 ${document.title} 已完全載入`
    });
});

document.addEventListener('click', (event) => {
    if (event.altKey) {
        event.preventDefault();
        const element = event.target;
        element.style.border = '2px solid red';
        console.log('Alt+Click 在元素上:', element);
    }
});