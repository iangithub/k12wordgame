/* ============================================================
   舉一反三 中文字遊戲 — 題庫與難度設定
   ------------------------------------------------------------
   資料結構：
     QUESTIONS = [
       {
         zhuyin: "ㄅ",                 // 本回合的單一注音提示
         cells: [                       // 三格，每格一個部件
           { component: "宀", allowedAnswers: ["寶", "賓"] },
           ...
         ]
       },
       ...
     ]

   出題原則（依 spec：先以 allowedAnswers 為標準答案，不做程式自動拆字／查注音）：
     1. 每個答案字的「讀音」皆以該回合的注音開頭。
     2. 每個答案字的「字形」皆含有該格指定的部件／偏旁。
   想加題：直接在 QUESTIONS 陣列尾端新增物件即可。
   ============================================================ */

const DIFFICULTIES = {
  easy:   { id: "easy",   name: "簡單", seconds: 90, emoji: "🐣" },
  medium: { id: "medium", name: "中等", seconds: 60, emoji: "🐯" },
  hard:   { id: "hard",   name: "困難", seconds: 40, emoji: "🐉" },
};

const QUESTIONS = [
  {
    zhuyin: "ㄅ",
    cells: [
      { component: "宀", allowedAnswers: ["寶", "賓"] },
      { component: "扌", allowedAnswers: ["把", "抱", "拔"] },
      { component: "艹", allowedAnswers: ["苞", "菠", "薄"] },
    ],
  },
  {
    zhuyin: "ㄆ",
    cells: [
      { component: "扌", allowedAnswers: ["拍", "捧", "批"] },
      { component: "氵", allowedAnswers: ["泡", "派", "漂"] },
      { component: "月", allowedAnswers: ["朋", "胖", "脾"] },
    ],
  },
  {
    zhuyin: "ㄇ",
    cells: [
      { component: "木", allowedAnswers: ["梅", "棉", "模"] },
      { component: "目", allowedAnswers: ["眉", "眠", "盲"] },
      { component: "艹", allowedAnswers: ["茅", "莫", "茫"] },
    ],
  },
  {
    zhuyin: "ㄈ",
    cells: [
      { component: "月", allowedAnswers: ["肺", "服", "腹"] },
      { component: "方", allowedAnswers: ["放", "房", "芳"] },
      { component: "言", allowedAnswers: ["訪", "諷", "誹"] },
    ],
  },
  {
    zhuyin: "ㄉ",
    cells: [
      { component: "扌", allowedAnswers: ["打", "抖", "擔"] },
      { component: "火", allowedAnswers: ["燈", "燉"] },
      { component: "言", allowedAnswers: ["讀", "訂", "誕"] },
    ],
  },
  {
    zhuyin: "ㄊ",
    cells: [
      { component: "扌", allowedAnswers: ["提", "推", "拖"] },
      { component: "木", allowedAnswers: ["桃", "梯", "桶"] },
      { component: "辶", allowedAnswers: ["逃", "透", "退"] },
    ],
  },
  {
    zhuyin: "ㄋ",
    cells: [
      { component: "女", allowedAnswers: ["奶", "娜", "娘"] },
      { component: "月", allowedAnswers: ["腦", "能", "膩"] },
      { component: "心", allowedAnswers: ["怒", "念"] },
    ],
  },
  {
    zhuyin: "ㄌ",
    cells: [
      { component: "木", allowedAnswers: ["樓", "梨", "李"] },
      { component: "氵", allowedAnswers: ["浪", "淚", "流"] },
      { component: "雨", allowedAnswers: ["雷", "零", "露"] },
    ],
  },
  {
    zhuyin: "ㄍ",
    cells: [
      { component: "扌", allowedAnswers: ["搞", "掛"] },
      { component: "木", allowedAnswers: ["概", "構", "櫃"] },
      { component: "宀", allowedAnswers: ["官", "寡", "宮"] },
    ],
  },
  {
    zhuyin: "ㄎ",
    cells: [
      { component: "扌", allowedAnswers: ["抗", "捆", "摳"] },
      { component: "火", allowedAnswers: ["烤", "炕"] },
      { component: "宀", allowedAnswers: ["寬", "寇"] },
    ],
  },
  {
    zhuyin: "ㄏ",
    cells: [
      { component: "氵", allowedAnswers: ["海", "河", "湖"] },
      { component: "艹", allowedAnswers: ["荷", "花", "荒"] },
      { component: "心", allowedAnswers: ["惠", "慧", "惑"] },
    ],
  },
  {
    zhuyin: "ㄐ",
    cells: [
      { component: "扌", allowedAnswers: ["擠", "接", "揀"] },
      { component: "木", allowedAnswers: ["機", "橘", "架"] },
      { component: "糸", allowedAnswers: ["級", "結", "經"] },
    ],
  },
  {
    zhuyin: "ㄑ",
    cells: [
      { component: "扌", allowedAnswers: ["搶", "掐", "撬"] },
      { component: "氵", allowedAnswers: ["汽", "泣", "淺"] },
      { component: "木", allowedAnswers: ["棋", "橋", "槍"] },
    ],
  },
  {
    zhuyin: "ㄒ",
    cells: [
      { component: "木", allowedAnswers: ["稀", "橡", "杏"] },
      { component: "氵", allowedAnswers: ["洗", "消", "汐"] },
      { component: "言", allowedAnswers: ["詳", "謝", "許"] },
    ],
  },
  {
    zhuyin: "ㄓ",
    cells: [
      { component: "扌", allowedAnswers: ["指", "招", "找"] },
      { component: "木", allowedAnswers: ["枝", "植", "株"] },
      { component: "言", allowedAnswers: ["諸", "診", "證"] },
    ],
  },
  {
    zhuyin: "ㄔ",
    cells: [
      { component: "扌", allowedAnswers: ["抽", "扯", "撤"] },
      { component: "氵", allowedAnswers: ["池", "沖", "潮"] },
      { component: "虫", allowedAnswers: ["蟲", "蠢"] },
    ],
  },
  {
    zhuyin: "ㄕ",
    cells: [
      { component: "扌", allowedAnswers: ["拾", "摔", "拴"] },
      { component: "言", allowedAnswers: ["詩", "試", "誰"] },
      { component: "木", allowedAnswers: ["梳", "樹", "栓"] },
    ],
  },
  {
    zhuyin: "ㄖ",
    cells: [
      { component: "灬", allowedAnswers: ["熱", "然"] },
      { component: "木", allowedAnswers: ["榮", "柔", "染"] },
      { component: "言", allowedAnswers: ["認", "讓"] },
    ],
  },
  {
    zhuyin: "ㄗ",
    cells: [
      { component: "宀", allowedAnswers: ["字", "宗", "宰"] },
      { component: "木", allowedAnswers: ["栽", "棕", "梓"] },
      { component: "糸", allowedAnswers: ["紫", "總", "組"] },
    ],
  },
  {
    zhuyin: "ㄘ",
    cells: [
      { component: "艹", allowedAnswers: ["草", "菜", "蔥"] },
      { component: "扌", allowedAnswers: ["操", "擦", "採"] },
      { component: "木", allowedAnswers: ["材", "槽", "村"] },
    ],
  },
  {
    zhuyin: "ㄙ",
    cells: [
      { component: "木", allowedAnswers: ["松", "森", "桑"] },
      { component: "糸", allowedAnswers: ["絲", "素", "索"] },
      { component: "宀", allowedAnswers: ["宋", "宿"] },
    ],
  },
];
