/* ============================================================
   sound.js — 以 Web Audio API 即時合成音效
   ------------------------------------------------------------
   優點：零音檔、可離線、file:// 可用、不增加 repo 體積。
   提供 window.WG_sound：correct / bonus / wrong / win / encourage / click
                         isMuted / setMuted / unlock
   ※ 無 AudioContext 的環境（如測試）會自動略過，不影響遊戲邏輯。
   ============================================================ */
(function () {
  "use strict";

  var ctx = null;
  var muted = false;
  try { muted = localStorage.getItem("wg_muted") === "1"; } catch (e) {}

  function getCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { return null; }
    return ctx;
  }

  // 單一音符（淡入淡出，避免爆音）
  function tone(c, freq, start, dur, type, peak) {
    var t0 = c.currentTime + start;
    var osc = c.createOscillator();
    var g = c.createGain();
    osc.type = type || "triangle";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak || 0.2, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function play(seq, type) {
    if (muted) return;
    var c = getCtx();
    if (!c) return;
    if (c.state === "suspended") { try { c.resume(); } catch (e) {} }
    seq.forEach(function (n) {
      tone(c, n.f, n.t, n.d || 0.15, type, n.g);
    });
  }

  // 音名 → 頻率
  var F = {
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
    A5: 880.0, B5: 987.77, C6: 1046.5, D6: 1174.7, E6: 1318.5, G6: 1568.0,
    G4: 392.0, A3: 220.0, D4: 293.66,
  };

  window.WG_sound = {
    // 答對：清脆上行三連音
    correct: function () { play([{ f: F.E5, t: 0 }, { f: F.G5, t: 0.09 }, { f: F.C6, t: 0.18, d: 0.22 }]); },
    // 全對：歡呼琶音
    bonus: function () {
      play([
        { f: F.C5, t: 0 }, { f: F.E5, t: 0.09 }, { f: F.G5, t: 0.18 },
        { f: F.C6, t: 0.27 }, { f: F.E6, t: 0.36 }, { f: F.G6, t: 0.45, d: 0.4 },
      ]);
    },
    // 答錯：溫和、不刺耳的兩音（搭配畫面上的「加油」訊息）
    wrong: function () { play([{ f: F.D4, t: 0, d: 0.18 }, { f: F.A3, t: 0.13, d: 0.26 }], "sine"); },
    // 結算勝利：較長的勝利樂句
    win: function () {
      play([
        { f: F.C5, t: 0 }, { f: F.E5, t: 0.12 }, { f: F.G5, t: 0.24 },
        { f: F.C6, t: 0.36, d: 0.3 }, { f: F.G5, t: 0.64 }, { f: F.C6, t: 0.76, d: 0.5 },
      ]);
    },
    // 鼓勵：輕快上揚
    encourage: function () { play([{ f: F.E5, t: 0, d: 0.2 }, { f: F.A5, t: 0.14, d: 0.3 }]); },
    // 按鈕點擊
    click: function () { play([{ f: F.A5, t: 0, d: 0.06, g: 0.12 }]); },

    isMuted: function () { return muted; },
    setMuted: function (m) {
      muted = !!m;
      try { localStorage.setItem("wg_muted", muted ? "1" : "0"); } catch (e) {}
    },
    // 首次使用者手勢時喚醒音訊（避開瀏覽器自動播放限制）
    unlock: function () {
      var c = getCtx();
      if (c && c.state === "suspended") { try { c.resume(); } catch (e) {} }
    },
  };
})();
