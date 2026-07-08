# FuSan-FaDaTsai

這是一個適合部署到 GitHub Pages 的期貨交易記帳 Dashboard。

## 功能

- 目前持倉
- 目前口數
- 總已實現損益
- 分配實現損益：75% / 25%，總本金基準 2,000,000
- 累積已實現損益趨勢圖
- 歷史成交紀錄分頁
- 日期篩選
- 預設顯示近 30 筆
- 資料來源：Google Sheets CSV

## Google Sheet 欄位

第一列請放這些欄位名稱：

| 欄位 | 說明 | 範例 |
|---|---|---|
| id | 交易編號 | T20260615001 |
| date | 日期 | 2026-06-15 |
| product | 商品 | 台指期 / 小台 |
| direction | 方向 | 多 / 空 |
| status | 狀態 | 已平倉 / 未平倉 |
| contracts | 口數 | 1 |
| entryPrice | 進場價 | 22500 |
| exitPrice | 出場價 | 22620，未平倉可空白 |
| pointValue | 每點價值 | 台指期 200，小台 50 |
| fee | 手續費 | 600 |
| realizedPnl | 已實現損益 | 23400，可空白讓網站自動算 |
| note | 備註 | 突破進場 |

## 損益計算

如果 `realizedPnl` 空白，網站會自動用以下公式：

- 多單：`(出場價 - 進場價) × 每點價值 × 口數 - 手續費`
- 空單：`(進場價 - 出場價) × 每點價值 × 口數 - 手續費`

## Google Sheets CSV 設定方式

1. 建立 Google Sheet。
2. 第一列填入欄位名稱。
3. 選擇：檔案 → 共用 → 發布到網路。
4. 選擇格式：CSV。
5. 複製發布網址。
6. 打開 `script.js`。
7. 把網址貼到：

```js
const GOOGLE_SHEET_CSV_URL = "你的 CSV 網址";
```

## GitHub Pages 部署

1. 在 GitHub 建立 repository，例如 `fusan-fadatsai`。
2. 上傳：
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`
3. 到 repository 的 `Settings`。
4. 點 `Pages`。
5. Source 選 `Deploy from a branch`。
6. Branch 選 `main`，資料夾選 `/root`。
7. 儲存後等待部署完成。

## 注意

這個版本是「你編輯 Google Sheets，朋友只看網站」。
如果 Google Sheet 發布成公開 CSV，知道資料來源網址的人理論上可以讀到資料。若之後想加權限，可以改成 Google Apps Script API 或 Firebase / Supabase。

## v5 更新

- 將「分配實現損益」獨立成一個分頁。
- 將「目前持倉明細」獨立成一個分頁。
- 手機版上方分頁改成四個按鈕：總覽 / 分配損益 / 持倉明細 / 歷史紀錄。


## v6 更新
- 分配實現損益改為「目前總收益」
- KH 本金 1,500,000，Nico 本金 500,000，總本金基準 2,000,000
- 目前金額 = 本金 + 已分配收益
- 使用橫條圖顯示目前金額，並用白色起跑線標示起始本金

## v7 更新
- 修正趨勢圖在手機上無限拉長的問題
- 上方副標改成「顧得意」
- 目前總收益：A 改為 KH，B 改為 Nico
- 目前總收益新增獲利百分比
- 歷史紀錄篩選下方新增總手續費、總交易稅、總損益
- 未篩選時統計全部資料；篩選後統計篩選結果

## v8 更新
- 支援使用者目前的表格格式。
- `product` 可以填 `小台5月`、`小台6月`，程式會自動視為小台，每點價值 50。
- `pointValue` 欄位不再拿來當每點價值；即使裡面放價差也不會影響計算。
- 未平倉資料可以只填日期、商品、方向、狀態、口數、進場價；出場、手續費、交易稅、realizedPnl 可以空白。
- 可接受狀態：已平倉、平倉、已出場、未平倉、持倉、持倉中、未出場。

## v9 更新
- 目前持倉卡片不再顯示「幾組持倉」，改顯示目前進場/均價。
- 目前總收益區塊固定使用 KH / Nico，並新增清楚的獲利率。
- 歷史紀錄日期篩選改成更像日曆卡片的輸入樣式。
- 修正總手續費、總交易稅、總損益可能顯示為 — 的問題。

## v10 更新
- 修正重新整理時數字可能跳動的問題。
- CSV 讀取加入 cache buster，避免 Google Sheets / 瀏覽器快取讀到新舊資料交錯。
- 移除重複 normalize 的流程，資料只整理一次。
- 連續按重新整理時，只採用最後一次回傳的資料，避免舊請求覆蓋新請求。

## v11 更新
- 移除頁面上的提示文字，避免 LINE / iMessage 分享連結時預覽到「提示：目前已連到你的 Google Sheets CSV...」。
- 新增 link preview meta description：顧得意。

## v12 更新
- 修正 `null is not an object (evaluating 'notice.style')`。
- 加回空白隱藏的 `setupNotice` 元素，避免舊版快取 script 找不到元素。
- script.js 加上 `?v=12`，強制手機瀏覽器更新快取。
- 提示文字仍然不會出現在 LINE / iMessage 預覽。


## v13 更新

- 總本金基準由 1,000,000 改為 2,000,000。
- KH 本金改為 1,500,000。
- Nico 本金改為 500,000。
- 收益率會以新的本金基準重新計算。
