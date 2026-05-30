/* ============================================================
   validator.js — 混合驗證的「程式自動判定」部分
   ------------------------------------------------------------
   依賴 data/dict.js 提供的：
     window.WG_ZHUYIN : { 字: "注音聲符字串" }   例 "重":"ㄓㄔ"
     window.WG_DECOMP : { 字: "遞迴部件字串" }   例 "茫":"艹氵亡..."
   提供：
     window.WG_NORM(ch)                         部件異體 → 標準形
     window.WG_validate(字, 目標注音, 目標部件)   → true/false
   規則：該字「任一讀音以目標注音開頭」且「字形（遞迴）含目標部件」。
   ※ 部件正規化表需與 _wgbuild/build.js 的 GROUPS 一致。
   ============================================================ */
(function () {
  "use strict";

  // 異體部件 → 標準形（以碼位定義，避免字形歧義）
  var GROUPS = {
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
  var NORM = {};
  Object.keys(GROUPS).forEach(function (canon) {
    GROUPS[canon].forEach(function (cp) {
      NORM[String.fromCodePoint(cp)] = canon;
    });
  });

  window.WG_NORM = function (ch) {
    return NORM[ch] || ch;
  };

  // 程式自動判定：讀音開頭符合 + 字形含部件
  window.WG_validate = function (ch, targetZhuyin, targetComponent) {
    if (!ch) return false;
    var zi = window.WG_ZHUYIN && window.WG_ZHUYIN[ch];
    if (!zi || zi.indexOf(targetZhuyin) === -1) return false; // 讀音不符
    var comps = window.WG_DECOMP && window.WG_DECOMP[ch];
    if (!comps) return false; // 無拆字資料，無法確認部件
    return comps.indexOf(window.WG_NORM(targetComponent)) !== -1;
  };
})();
