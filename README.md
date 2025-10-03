# CyberBiz 資料下載工具

一個自動化下載 CyberBiz 後台報表資料的 Chrome 擴充功能。

## 功能簡介

本擴充功能可以自動化執行以下操作：
- 自動設定指定月份的日期範圍（上個月或本月）
- 自動點擊導出報告按鈕
- 自動勾選「已閱讀並確認」checkbox
- 自動點擊「我同意」確認按鈕
- 自動跳轉到正確的報表頁面（如果當前不在目標頁面）

## 專案架構

```
cyberbiz-download/
├── manifest.json          # Chrome 擴充功能設定檔
├── popup.html             # 擴充功能彈出視窗的 HTML 結構
├── popup.js               # 彈出視窗的邏輯控制
├── styles.css             # 彈出視窗的樣式
├── background.js          # 背景服務 (Service Worker)
├── content.js             # 內容腳本（注入到網頁中執行）
└── icons/                 # 擴充功能圖示
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 核心檔案說明

### 1. manifest.json
Chrome 擴充功能的核心設定檔，定義了：
- **manifest_version**: 3（使用 Manifest V3）
- **permissions**: 需要的權限（activeTab, storage, webNavigation, tabs）
- **host_permissions**: 可訪問的網站權限
- **background**: 背景服務配置
- **content_scripts**: 內容腳本配置
- **action**: popup 視窗配置

### 2. popup.html + popup.js
使用者介面層，提供簡潔的操作介面：
- **兩個按鈕**: 「上個月」和「本月」
- **狀態顯示區**: 顯示執行進度和結果

**主要功能**：
- 計算上個月/本月的日期範圍
- 檢查當前頁面路徑是否為目標路徑（`/admin/orders/reportion`）
- 如果路徑不正確，透過 background script 跳轉並設定待執行任務
- 如果路徑正確，直接發送訊息給 content script 執行

### 3. background.js
背景服務（Service Worker），負責跨頁面的協調工作：

**核心功能**：
1. **任務儲存機制**: 使用 `pendingTasks` Map 儲存待執行任務
2. **頁面導航**: 處理 `navigateToPage` 訊息，跳轉到目標頁面
3. **頁面狀態檢查**: 透過 `waitForPageReady()` 函數確認頁面是否準備就緒
4. **自動執行機制**: 監聽 `webNavigation.onCompleted` 事件，在頁面載入完成後自動執行待處理任務

**重要函數**：
- `waitForPageReady(tabId, maxRetries)`: 輪詢檢查頁面是否準備好（最多重試指定次數）
- 每次檢查間隔 500ms

### 4. content.js
注入到目標網頁中執行的腳本，負責實際的 DOM 操作：

**核心功能**：
1. **日期設定**: `setDateRange(year, month)` - 設定起始和結束日期
2. **點擊導出按鈕**: `clickExportReportButton()` - 點擊 `#export-report` 按鈕
3. **勾選 checkbox**: `clickReadAndConfirmCheckbox()` - 勾選 `#read_and_confirm`
4. **點擊確認**: `clickAgreeButton()` - 點擊內容為「我同意」的 `.confirm` 按鈕
5. **頁面驗證**: `validateDatePickers()` - 檢查必要的日期選擇器是否存在

**執行流程**（收到 `downloadData` 訊息後）：
1. 驗證頁面準備狀態
2. 設定日期範圍
3. 延遲 1 秒後點擊導出按鈕
4. 再延遲 1 秒後勾選 checkbox
5. 再延遲 0.5 秒後點擊「我同意」按鈕

## 工作流程圖

```
使用者點擊按鈕（上個月/本月）
    ↓
popup.js 檢查當前頁面路徑
    ↓
┌─────────────────────────┐
│ 路徑正確？              │
└─────────────────────────┘
    ├── 是 → 直接發送訊息給 content.js 執行
    │
    └── 否 → 發送 navigateToPage 給 background.js
                ↓
            background.js 跳轉頁面並儲存待執行任務
                ↓
            監聽 webNavigation.onCompleted 事件
                ↓
            頁面載入完成後，呼叫 waitForPageReady()
                ↓
            頁面準備完成後，發送待執行任務給 content.js
                ↓
            content.js 執行自動化流程：
                1. 設定日期範圍
                2. 點擊導出按鈕
                3. 勾選 checkbox
                4. 點擊確認按鈕
```

## 訊息通訊機制

本擴充功能使用 Chrome 的訊息傳遞系統進行三個層級的通訊：

### popup.js ↔ background.js
- `navigateToPage`: 請求跳轉頁面
- `waitForPageReady`: 請求檢查頁面狀態

### popup.js ↔ content.js
- `downloadData`: 請求執行資料下載流程

### background.js ↔ content.js
- `validatePage`: 驗證頁面是否準備好
- `downloadData`: 執行待處理任務（由 background 自動觸發）

## 安裝方式

1. 下載或克隆此專案
2. 開啟 Chrome 瀏覽器，前往 `chrome://extensions/`
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」
5. 選擇本專案的資料夾

## 使用方式

1. 前往 CyberBiz 後台（任何頁面皆可）
2. 點擊瀏覽器工具列上的擴充功能圖示
3. 選擇「上個月」或「本月」
4. 擴充功能會自動：
   - 跳轉到報表頁面（如需要）
   - 設定對應月份的日期範圍
   - 完成所有確認步驟
   - 觸發報表下載

## 技術特點

1. **智能路徑檢測**: 自動判斷是否在目標頁面，不在則自動跳轉
2. **任務暫存機制**: 跳轉頁面時保存任務，頁面載入後自動執行
3. **頁面準備檢測**: 使用輪詢機制確保頁面完全載入後才執行操作
4. **延遲執行策略**: 在各個操作之間加入適當延遲，確保頁面響應
5. **錯誤處理**: 完整的 try-catch 錯誤處理和狀態回饋

## 目標頁面

- **路徑**: `/admin/orders/reportion`
- **必要元素**:
  - `#from_date`: 起始日期輸入框
  - `#thru_date`: 結束日期輸入框
  - `#export-report`: 導出按鈕
  - `#read_and_confirm`: 確認 checkbox
  - `.confirm` (內容為「我同意」): 確認按鈕

## 注意事項

- 本擴充功能專為 CyberBiz 後台系統設計
- 需要在有效的登入狀態下使用
- 如果頁面結構變更，可能需要更新選擇器
