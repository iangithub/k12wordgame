/* ============================================================
   build-dict.js — 產生 ../data/dict.js（注音聲符表 + 遞迴部件表）
   ------------------------------------------------------------
   用途：當你在 questions.js 增刪題目、或想擴充可自動判定的字集時，
         重新產生混合驗證所需的字典資料。
   執行：
     cd wordgame/tools
     npm init -y && npm install pinyin-pro
     node build-dict.js
   會：1) 自動下載 CHISE/cjkvi-ids 拆字資料（首次）
       2) 以 pinyin-pro 取得讀音 → 注音聲符
       3) 產生 ../data/dict.js
       4) 用 questions.js 的所有 allowedAnswers 當 ground truth 自我驗證
   ※ 部件正規化 GROUPS 必須與 ../validator.js 保持一致。
   ============================================================ */
const fs = require("fs");
const path = require("path");
const { pinyin } = require("pinyin-pro");

const OUT_DIR = path.resolve(__dirname, "../data");
const IDS_FILE = path.resolve(__dirname, "ids_raw.txt");
const Q_FILE = path.resolve(__dirname, "../questions.js");
const IDS_URL = "https://raw.githubusercontent.com/cjkvi/cjkvi-ids/master/ids.txt";

// 部件正規化（異體 → 標準形），以碼位定義
const GROUPS = {
  "氵": [0x6c34, 0x6c35, 0x6c3a, 0x2ea1],
  "扌": [0x624b, 0x624c, 0x2e98],
  "艹": [0x8278, 0x8279, 0x2ebe, 0x2ebf, 0x2ec0],
  "心": [0x5fc3, 0x5fc4, 0x2e96, 0x2e97],
  "火": [0x706b, 0x706c, 0x2ea3],
  "月": [0x6708, 0x2ebc, 0x8089],
  "糸": [0x7cf8, 0x7cf9, 0x2eaf, 0x7e9f],
  "言": [0x8a00, 0x8a01, 0x2ec8, 0x8ba0],
  "辶": [0x8fb5, 0x8fb6, 0x2ecc, 0x2ecd],
  "雨": [0x96e8, 0x2ed7],
};
const NORM = {};
for (const [canon, cps] of Object.entries(GROUPS))
  for (const cp of cps) NORM[String.fromCodePoint(cp)] = canon;
const norm = (ch) => NORM[ch] || ch;

async function ensureIds() {
  if (fs.existsSync(IDS_FILE)) return;
  console.log("下載拆字資料 " + IDS_URL + " …");
  const r = await fetch(IDS_URL);
  if (!r.ok) throw new Error("下載失敗 HTTP " + r.status);
  fs.writeFileSync(IDS_FILE, await r.text());
}

function loadIds() {
  const map = new Map();
  for (const line of fs.readFileSync(IDS_FILE, "utf8").split(/\r?\n/)) {
    if (!line || line[0] === "#") continue;
    const p = line.split("\t");
    if (p.length >= 3 && !map.has(p[1])) map.set(p[1], p[2]);
  }
  return map;
}

const isOp = (c) => c >= "⿰" && c <= "⿿";
const stripAnno = (s) => s.replace(/[\[\{][^\]\}]*[\]\}]/g, "");

function componentsOf(ch, idsMap) {
  const out = new Set();
  const visited = new Set();
  (function rec(c, depth) {
    if (depth > 30 || visited.has(c)) return;
    visited.add(c);
    out.add(norm(c));
    let ids = idsMap.get(c);
    if (!ids) return;
    ids = stripAnno(ids);
    for (const part of ids) {
      if (isOp(part)) continue;
      if (/[&;\[\]A-Za-z0-9\-]/.test(part)) continue;
      if (part === c) continue;
      rec(part, depth + 1);
    }
  })(ch, 0);
  return out;
}

const INITIALS = [
  ["zh", "ㄓ"], ["ch", "ㄔ"], ["sh", "ㄕ"],
  ["b", "ㄅ"], ["p", "ㄆ"], ["m", "ㄇ"], ["f", "ㄈ"],
  ["d", "ㄉ"], ["t", "ㄊ"], ["n", "ㄋ"], ["l", "ㄌ"],
  ["g", "ㄍ"], ["k", "ㄎ"], ["h", "ㄏ"],
  ["j", "ㄐ"], ["q", "ㄑ"], ["x", "ㄒ"], ["r", "ㄖ"],
  ["z", "ㄗ"], ["c", "ㄘ"], ["s", "ㄙ"],
];
function pyFirstZhuyin(py) {
  const b = py.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  for (const [p, z] of INITIALS) if (b.startsWith(p)) return z;
  if (/^(yu|ü)/.test(b)) return "ㄩ";
  if (b.startsWith("y")) return "ㄧ";
  if (b.startsWith("w")) return "ㄨ";
  const v = { a: "ㄚ", o: "ㄛ", e: "ㄜ", i: "ㄧ", u: "ㄨ" };
  return v[b[0]] || "";
}
function zhuyinInitials(ch) {
  const reads = pinyin(ch, { toneType: "none", type: "array", multiple: true });
  const syms = new Set();
  for (const r of reads) {
    if (!/^[a-zü]+$/i.test(r)) continue;
    const z = pyFirstZhuyin(r);
    if (z) syms.add(z);
  }
  return [...syms].join("");
}

(async () => {
  await ensureIds();
  const idsMap = loadIds();
  console.log("IDS 字數：" + idsMap.size);

  const qCode = fs.readFileSync(Q_FILE, "utf8");
  const { QUESTIONS } = new Function(qCode + "\nreturn { QUESTIONS };")();

  const charSet = new Set();
  for (const q of QUESTIONS)
    for (const cell of q.cells)
      for (const a of cell.allowedAnswers) charSet.add(a);
  // 涵蓋「輸入框（game.js 的 CJK_RE）能接受的全部範圍」：擴充A + 基本 + 相容區
  const RANGES = [
    ["擴充A", 0x3400, 0x4dbf],
    ["基本", 0x4e00, 0x9fff],
    ["相容", 0xf900, 0xfaff],
  ];
  for (const [name, lo, hi] of RANGES) {
    let added = 0;
    for (let cp = lo; cp <= hi; cp++) {
      const ch = String.fromCodePoint(cp);
      if (!idsMap.has(ch)) continue;
      if (zhuyinInitials(ch) === "") continue;
      if (!charSet.has(ch)) added++;
      charSet.add(ch);
    }
    console.log(`  ${name}區（${hi - lo + 1} 碼位）：新增收錄 ${added} 字`);
  }

  const ZHUYIN = {};
  const DECOMP = {};
  for (const ch of charSet) {
    const zi = zhuyinInitials(ch);
    if (zi) ZHUYIN[ch] = zi;
    const comps = [...componentsOf(ch, idsMap)].join("");
    if (comps) DECOMP[ch] = comps;
  }
  console.log("收錄字數：" + charSet.size);

  // ground truth 自我驗證
  const validate = (ch, zhuyin, component) => {
    const zi = ZHUYIN[ch];
    if (!zi || zi.indexOf(zhuyin) === -1) return false;
    const set = DECOMP[ch];
    return !!set && set.indexOf(norm(component)) !== -1;
  };
  let fail = 0, total = 0;
  for (const q of QUESTIONS)
    for (const cell of q.cells)
      for (const a of cell.allowedAnswers) {
        total++;
        if (!validate(a, q.zhuyin, cell.component)) {
          fail++;
          console.log(`❌ ground truth 失敗：${q.zhuyin}+${cell.component}「${a}」`);
        }
      }
  console.log(`Ground truth：${total - fail}/${total} 通過`);
  if (fail) { console.error("有題庫答案無法被程式驗證，請檢查資料或正規化。中止輸出。"); process.exit(1); }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const header =
    "/* 自動產生，請勿手改。由 tools/build-dict.js 產生。\n" +
    "   WG_ZHUYIN: 字→注音聲符；WG_DECOMP: 字→遞迴部件（已正規化） */\n";
  fs.writeFileSync(
    path.join(OUT_DIR, "dict.js"),
    header +
      "window.WG_ZHUYIN=" + JSON.stringify(ZHUYIN) + ";\n" +
      "window.WG_DECOMP=" + JSON.stringify(DECOMP) + ";\n"
  );
  const kb = (fs.statSync(path.join(OUT_DIR, "dict.js")).size / 1024).toFixed(0);
  console.log("已輸出 ../data/dict.js（" + kb + " KB）");
})();
