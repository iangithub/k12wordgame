# 舉一反三 ✦ 中文字益智遊戲

一款給 **K12 學生**玩的中文字小遊戲：看「注音」＋「部件」，猜出正確的中文字。
純靜態網頁（HTML / CSS / JavaScript），**不需後端、不需安裝、執行時不連網、不呼叫任何 AI**，可直接部署到 GitHub Pages。

## 玩法

- 左側顯示一個注音符號（例如「ㄅ」）。
- 右側有 3 張部件圖卡（例如「宀」「扌」「艹」）。
- 每一格填入一個中文字，需同時符合：
  1. 讀音以該注音開頭。
  2. 字形含有該格的部件。
- 每格答對 10 分；一回合三格全對額外 +10 分。
- 每題有倒數計時，時間到自動送出。
- 全部回合結束後顯示結算（總分、答對格數、正確率）。

## 判定機制（混合驗證，全程離線）

玩家輸入的字會用兩段判定，**任一通過即算對**：

1. **題庫快取**：字在該格 `questions.js` 的 `allowedAnswers` 裡 → 直接正確。
2. **程式自動驗證**（`validator.js` + `data/dict.js`）：題庫沒收錄、但確實「讀音以該注音開頭」且「字形（遞迴拆字）含該部件」的字，也判正確。

這解決了「正確但不在題庫」會被誤判的問題。例如 `ㄅ＋扌`，題庫只列 `把／抱／拔`，但玩家填 `捕／搬／撥／播／擺` 同樣會被判對。

> **讀音怎麼來、要不要連 AI？** 不用。`data/dict.js` 是一張**事先打包好的查表**：`字 → 注音聲符`、`字 → 部件集合`，由 `tools/build-dict.js` 在開發時用開源資料產生（讀音來自 [pinyin-pro]、拆字來自 [CHISE / cjkvi-ids] 的 IDS 資料）。執行時瀏覽器只做查表，零連線、零 AI。
>
> 涵蓋約 2 萬個常用字。極少數罕用字若不在表中則無法自動驗證，仍可靠題庫 `allowedAnswers` 補上。

[pinyin-pro]: https://github.com/zh-lx/pinyin-pro
[CHISE / cjkvi-ids]: https://github.com/cjkvi/cjkvi-ids

## 難度

| 難度 | 每題時間 |
| ---- | -------- |
| 簡單 | 90 秒 |
| 中等 | 60 秒 |
| 困難 | 40 秒 |

難度只影響倒數時間，題目規則完全相同。

## 檔案結構

```
wordgame/
├── index.html        # 畫面結構
├── styles.css        # 樣式（K12 友善、支援手機／平板）
├── questions.js      # 題庫 + 難度設定（要加題改這裡）
├── validator.js      # 混合驗證：程式自動判定（注音＋部件）
├── game.js           # 遊戲邏輯
├── data/
│   └── dict.js       # 自動產生的查表（字→注音聲符、字→部件），約 950 KB
├── tools/
│   ├── build-dict.js # 重新產生 data/dict.js 的腳本
│   └── README.md
├── README.md
└── spec.txt          # 原始規格
```

> 部署時 **`data/` 與 `validator.js` 必須一起上傳**；`tools/` 只用於重新產生資料，可不部署。

## 本機執行

直接用瀏覽器開啟 `index.html` 即可遊玩（資料以 `<script>` 載入，`file://` 也能跑，注音輸入法可用）。

若要更接近正式環境，可開本機伺服器：

```powershell
# Python 3
python -m http.server 8000
# 然後瀏覽 http://localhost:8000/wordgame/
```

## 部署到 GitHub Pages

1. 將專案推上 GitHub repository（含 `data/` 與 `validator.js`）。
2. 進入 repo 的 **Settings → Pages**。
3. **Source** 選 `Deploy from a branch`，Branch 選 `main`。
4. 稍候幾分鐘，即可從 `https://<帳號>.github.io/<repo>/wordgame/` 開啟。

> `data/dict.js` 約 950 KB，GitHub Pages 會自動以 gzip/brotli 壓縮傳輸（實際約 300 KB）。

## 如何新增題目

打開 `questions.js`，在 `QUESTIONS` 陣列尾端加上一筆：

```js
{
  zhuyin: "ㄆ",                 // 本回合的單一注音
  cells: [
    { component: "扌", allowedAnswers: ["拍", "捧", "批"] },
    { component: "氵", allowedAnswers: ["泡", "派", "漂"] },
    { component: "月", allowedAnswers: ["朋", "胖", "脾"] },
  ],
},
```

- `allowedAnswers` 至少放一個標準答案；其餘正確的字會由程式自動驗證接受，不必窮舉。
- 若用到新的部件異體（偏旁變形），請同步更新 `validator.js` 與 `tools/build-dict.js` 裡的 `GROUPS` 正規化表。
- 改完題庫若想擴充自動驗證字集，可重新產生字典（見下）。

## 重新產生字典 `data/dict.js`

```powershell
cd wordgame/tools
npm init -y; npm install pinyin-pro
node build-dict.js
```

腳本會自動下載拆字資料、產生 `data/dict.js`，並用題庫所有答案做 ground-truth 自我驗證（不通過會中止並列出問題字）。
