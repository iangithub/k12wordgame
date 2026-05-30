# tools — 字典產生器

只在「開發時」用來產生 `../data/dict.js`（混合驗證所需的查表）。
**不需要部署**，遊戲執行時不依賴這個資料夾。

## 用法

```powershell
cd wordgame/tools
npm init -y; npm install pinyin-pro
node build-dict.js
```

流程：
1. 首次執行會下載 CHISE / cjkvi-ids 的拆字（IDS）資料到 `ids_raw.txt`。
2. 用 `pinyin-pro` 取得讀音 → 轉注音聲符。
3. 遞迴拆字並正規化部件，產生 `../data/dict.js`。
4. 以 `../questions.js` 的所有 `allowedAnswers` 做 ground-truth 自我驗證；
   若有題庫答案無法被程式驗證，會中止並列出問題字。

## 注意

- `GROUPS`（部件異體正規化表）必須與 `../validator.js` 一致。
- 資料來源：
  - 讀音 [pinyin-pro](https://github.com/zh-lx/pinyin-pro)
  - 拆字 [cjkvi-ids](https://github.com/cjkvi/cjkvi-ids)（基於 CHISE IDS）
