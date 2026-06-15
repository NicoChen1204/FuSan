# FuSan-FaDaTsai

這是一個適合部署到 GitHub Pages 的期貨交易記帳 Dashboard。

## 功能

- 目前持倉
- 目前口數
- 總已實現損益
- 分配實現損益：75% / 25%
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
- A 本金 750,000，B 本金 250,000
- 目前金額 = 本金 + 已分配收益
- 使用橫條圖顯示目前金額，並用白色起跑線標示起始本金
