/* ============================================================
   舉一反三 中文字遊戲 — 主程式
   依賴：questions.js 提供的全域變數 QUESTIONS、DIFFICULTIES
   ============================================================ */
(function () {
  "use strict";

  const TOTAL = QUESTIONS.length;          // 總回合數
  const CELLS_PER_ROUND = 3;               // 每回合格數
  const CIRCLED = ["①", "②", "③"];         // 部件編號
  // 中文字偵測（基本漢字 + 擴充A + 相容區）
  const CJK_RE = /[㐀-䶿一-鿿豈-﫿]/g;

  // ---- 遊戲狀態 ----
  const state = {
    difficulty: "medium",
    round: 0,
    score: 0,
    correctCells: 0,
    bonusRounds: 0,
    submitted: false,
    timeLeft: 0,
    timerId: null,
    composing: false, // 是否正在使用輸入法組字
    order: [],        // 本局出題順序（隨機洗牌後的題目索引）
  };

  // ---- DOM 取得 ----
  const $ = (sel) => document.querySelector(sel);
  const screens = {
    start: $("#start-screen"),
    game: $("#game-screen"),
    results: $("#results-screen"),
  };
  const el = {
    score: $("#stat-score"),
    round: $("#stat-round"),
    time: $("#stat-time"),
    zhuyin: $("#zhuyin-card"),
    rule: $("#rule-text"),
    rows: $("#answer-rows"),
    feedback: $("#feedback"),
    btnSubmit: $("#btn-submit"),
    btnNext: $("#btn-next"),
    btnRestart: $("#btn-restart"),
    difficultyOptions: $("#difficulty-options"),
    resScore: $("#res-score"),
    resCorrect: $("#res-correct"),
    resTotalCells: $("#res-total-cells"),
    resRounds: $("#res-rounds"),
    resAccuracy: $("#res-accuracy"),
    resBonus: $("#res-bonus"),
    btnPlayAgain: $("#btn-play-again"),
    btnHome: $("#btn-home"),
    btnMute: $("#btn-mute"),
    resMessage: $("#res-message"),
  };

  // ---- 畫面切換 ----
  function showScreen(name) {
    Object.keys(screens).forEach((key) => {
      const isActive = key === name;
      screens[key].hidden = !isActive;
      screens[key].classList.toggle("screen--active", isActive);
    });
  }

  // ---- 開始畫面：產生難度按鈕 ----
  function buildDifficultyButtons() {
    el.difficultyOptions.innerHTML = "";
    Object.values(DIFFICULTIES).forEach((d) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "difficulty-btn";
      btn.innerHTML =
        `<span class="difficulty-btn__emoji">${d.emoji}</span>` +
        `<span class="difficulty-btn__name">${d.name}</span>` +
        `<span class="difficulty-btn__time">每題 ${d.seconds} 秒</span>`;
      btn.addEventListener("click", () => {
        sfx("unlock");
        sfx("click");
        startGame(d.id);
      });
      el.difficultyOptions.appendChild(btn);
    });
  }

  // 產生 0..n-1 的隨機排列（Fisher–Yates 洗牌），用於隨機出題順序
  function shuffledIndices(n) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- 情緒回饋訊息 ----
  const PRAISE_ALL = [
    "太完美了！三題全對！🎉",
    "全中！你是中文字高手！🏆",
    "滿分回合，超強的！🌟",
    "哇！完全正確，太厲害了！✨",
  ];
  const PRAISE_SOME = [
    "答對了，做得好！👍",
    "不錯喔，這個感覺對了！🎯",
    "很好，你越來越厲害了！💪",
    "答對囉，繼續保持！😄",
  ];
  const ENCOURAGE = [
    "沒關係，再試一次就會了！💪",
    "別灰心，下一題你一定行！🌈",
    "差一點點，加油！你做得到！🔥",
    "勇敢猜，錯了也沒關係！😊",
  ];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // 播放音效（WG_sound 不存在時自動略過）
  function sfx(name) {
    if (window.WG_sound && typeof window.WG_sound[name] === "function") window.WG_sound[name]();
  }

  // 更新靜音鈕圖示
  function updateMuteIcon() {
    if (!el.btnMute) return;
    const m = window.WG_sound ? window.WG_sound.isMuted() : false;
    el.btnMute.textContent = m ? "🔇" : "🔊";
    el.btnMute.setAttribute("aria-label", m ? "開啟音效" : "靜音");
    el.btnMute.classList.toggle("is-muted", m);
  }

  // 慶祝彩帶（自含、無資產；無 document 時略過）
  function confetti(count) {
    if (typeof document === "undefined" || !document.body) return;
    const colors = ["#6366f1", "#f59e0b", "#16a34a", "#ec4899", "#06b6d4", "#f43f5e"];
    for (let i = 0; i < count; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.3 + "s";
      p.style.animationDuration = 1.3 + Math.random() * 0.7 + "s";
      document.body.appendChild(p);
      setTimeout(function () { p.remove(); }, 2200);
    }
  }

  // 答對格子的星星動畫（自含、無資產；無 document 時略過）
  function starBurst(rowEl) {
    if (typeof document === "undefined" || !rowEl) return;
    for (let i = 0; i < 5; i++) {
      const s = document.createElement("span");
      s.className = "star-pop";
      s.textContent = "⭐";
      s.style.left = 20 + Math.random() * 60 + "%";
      s.style.animationDelay = i * 0.05 + "s";
      rowEl.appendChild(s);
      setTimeout(function () { s.remove(); }, 900);
    }
  }

  // ---- 開始一場新遊戲 ----
  function startGame(difficultyId) {
    state.difficulty = difficultyId;
    state.round = 0;
    state.score = 0;
    state.correctCells = 0;
    state.bonusRounds = 0;
    state.order = shuffledIndices(TOTAL); // 每局重新隨機出題順序
    el.score.textContent = "0";
    showScreen("game");
    loadRound(0);
  }

  // ---- 載入某一回合 ----
  function loadRound(index) {
    state.round = index;
    state.submitted = false;
    const q = QUESTIONS[state.order[index]];

    el.zhuyin.textContent = q.zhuyin;
    el.rule.innerHTML =
      `請在每一格填入一個中文字：讀音為「<strong>${q.zhuyin}</strong>」開頭，` +
      `而且字形含有該格的部件。`;
    el.feedback.textContent = "";
    el.round.textContent = `${index + 1} / ${TOTAL}`;

    // 產生三個答題列
    el.rows.innerHTML = "";
    q.cells.forEach((cell, i) => {
      const row = document.createElement("div");
      row.className = "answer-row";
      row.innerHTML =
        `<div class="component-card">` +
        `<span class="component-card__tag">部件 ${CIRCLED[i]}</span>` +
        `<span class="component-card__char">${cell.component}</span>` +
        `</div>` +
        `<input class="answer-input" type="text" maxlength="1" ` +
        `inputmode="text" autocomplete="off" autocapitalize="off" ` +
        `spellcheck="false" lang="zh-Hant" aria-label="第 ${i + 1} 格答案" />` +
        `<div class="status status--pending">尚未作答</div>`;
      el.rows.appendChild(row);

      const input = row.querySelector(".answer-input");
      bindInput(input);
    });

    // 按鈕狀態：作答中
    el.btnSubmit.hidden = false;
    el.btnSubmit.disabled = false;
    el.btnNext.hidden = true;

    startTimer();

    // 自動聚焦第一格，方便立即作答
    const first = el.rows.querySelector(".answer-input");
    if (first) first.focus();
  }

  // ---- 輸入框：限制只能留一個中文字、支援輸入法 ----
  function bindInput(input) {
    input.addEventListener("compositionstart", () => { state.composing = true; });
    input.addEventListener("compositionend", () => {
      state.composing = false;
      sanitize(input);
    });
    input.addEventListener("input", () => {
      if (!state.composing) sanitize(input);
    });
  }

  function sanitize(input) {
    const matched = input.value.match(CJK_RE);
    // 取「最後一個」中文字，讓重複輸入時能直接取代舊字
    input.value = matched ? matched[matched.length - 1] : "";
  }

  // ---- 計時器 ----
  function startTimer() {
    clearTimer();
    state.timeLeft = DIFFICULTIES[state.difficulty].seconds;
    renderTime();
    state.timerId = window.setInterval(() => {
      state.timeLeft -= 1;
      renderTime();
      if (state.timeLeft <= 10 && state.timeLeft > 0) sfx(state.timeLeft <= 3 ? "tickUrgent" : "tick");
      if (state.timeLeft <= 0) {
        clearTimer();
        submitAnswers(true); // 時間到自動送出
      }
    }, 1000);
  }
  function clearTimer() {
    if (state.timerId) {
      window.clearInterval(state.timerId);
      state.timerId = null;
    }
  }
  function renderTime() {
    el.time.textContent = `${Math.max(0, state.timeLeft)} 秒`;
    el.time.classList.toggle("time--low", state.timeLeft <= 10);
  }

  // ---- 送出答案 ----
  function submitAnswers(auto) {
    if (state.submitted) return;
    state.submitted = true;
    clearTimer();

    const q = QUESTIONS[state.order[state.round]];
    const rows = el.rows.querySelectorAll(".answer-row");
    let roundCorrect = 0;

    rows.forEach((row, i) => {
      const input = row.querySelector(".answer-input");
      const status = row.querySelector(".status");
      sanitize(input);
      const value = input.value;
      const cell = q.cells[i];
      // 混合驗證：先查題庫（已知正確／快取），清單外的字再用注音＋拆字資料程式判定
      const isCorrect =
        cell.allowedAnswers.includes(value) ||
        (value !== "" &&
          typeof window.WG_validate === "function" &&
          window.WG_validate(value, q.zhuyin, cell.component));

      input.disabled = true; // 送出後鎖定
      input.classList.remove("answer-input--correct", "answer-input--wrong");
      status.classList.remove("status--pending", "status--missed", "status--correct", "status--wrong");

      if (isCorrect) {
        roundCorrect += 1;
        input.classList.add("answer-input--correct");
        status.classList.add("status--correct");
        status.textContent = "正確 ✓";
        starBurst(row);
      } else if (value === "") {
        status.classList.add("status--missed");
        status.textContent = "未作答";
      } else {
        input.classList.add("answer-input--wrong");
        status.classList.add("status--wrong");
        status.textContent = "答錯 ✗";
      }
    });

    // 計分：每格 10 分；三格全對額外 +10
    let gained = roundCorrect * 10;
    let bonus = 0;
    if (roundCorrect === CELLS_PER_ROUND) {
      bonus = 10;
      gained += bonus;
      state.bonusRounds += 1;
    }
    state.score += gained;
    state.correctCells += roundCorrect;
    el.score.textContent = String(state.score);

    // 音效 + 情緒回饋
    let praise;
    if (roundCorrect === CELLS_PER_ROUND) { praise = pick(PRAISE_ALL); sfx("bonus"); confetti(80); }
    else if (roundCorrect >= 1) { praise = pick(PRAISE_SOME); sfx("correct"); }
    else { praise = pick(ENCOURAGE); sfx("wrong"); }

    let detail = `答對 ${roundCorrect} / ${CELLS_PER_ROUND} 格，得 ${gained} 分`;
    if (bonus) detail += "　全對 +10！";
    if (auto) detail = "⏰ 時間到，自動送出　·　" + detail;
    el.feedback.innerHTML =
      `<span class="feedback__main">${praise}</span>` +
      `<span class="feedback__detail">${detail}</span>`;
    el.feedback.classList.remove("feedback--pop");
    void el.feedback.offsetWidth; // 強制重排以重新觸發彈跳動畫
    el.feedback.classList.add("feedback--pop");

    // 按鈕狀態：已送出
    el.btnSubmit.hidden = true;
    const isLast = state.round + 1 >= TOTAL;
    el.btnNext.hidden = false;
    el.btnNext.textContent = isLast ? "看結果 🏁" : "下一題";
  }

  // ---- 下一題 / 看結果 ----
  function nextRound() {
    if (!state.submitted) return;
    if (state.round + 1 >= TOTAL) {
      showResults();
    } else {
      loadRound(state.round + 1);
    }
  }

  // ---- 重新開始（同難度，回到第一題） ----
  function restartGame() {
    clearTimer();
    startGame(state.difficulty);
  }

  // ---- 結算畫面 ----
  function showResults() {
    clearTimer();
    const totalCells = TOTAL * CELLS_PER_ROUND;
    const accuracy = totalCells ? Math.round((state.correctCells / totalCells) * 100) : 0;

    el.resScore.textContent = String(state.score);
    el.resCorrect.textContent = String(state.correctCells);
    el.resTotalCells.textContent = String(totalCells);
    el.resRounds.textContent = String(TOTAL);
    el.resAccuracy.textContent = `${accuracy}%`;
    el.resBonus.textContent = state.bonusRounds
      ? `全對回合：${state.bonusRounds} 回（額外 +${state.bonusRounds * 10} 分）`
      : "這次沒有全對的回合，再挑戰看看吧！";

    // 依正確率給總評 + 音效 + 慶祝
    let resMsg, great = false;
    if (accuracy >= 90) { resMsg = "🏆 字詞高手！太厲害了！"; great = true; }
    else if (accuracy >= 70) { resMsg = "🌟 表現很棒，繼續保持！"; great = true; }
    else if (accuracy >= 50) { resMsg = "💪 不錯喔，再多練習會更強！"; }
    else { resMsg = "🌈 沒關係，多玩幾次一定會進步！"; }
    if (el.resMessage) el.resMessage.textContent = resMsg;
    if (great) { sfx("win"); confetti(140); } else { sfx("encourage"); }

    showScreen("results");
  }

  // ---- 全域事件 ----
  function bindGlobalEvents() {
    el.btnSubmit.addEventListener("click", () => submitAnswers(false));
    el.btnNext.addEventListener("click", () => { sfx("click"); nextRound(); });
    el.btnRestart.addEventListener("click", () => { sfx("click"); restartGame(); });
    el.btnPlayAgain.addEventListener("click", () => { sfx("click"); startGame(state.difficulty); });
    el.btnHome.addEventListener("click", () => { sfx("click"); showScreen("start"); });

    // 靜音切換
    if (el.btnMute) {
      updateMuteIcon();
      el.btnMute.addEventListener("click", () => {
        const m = window.WG_sound ? !window.WG_sound.isMuted() : true;
        if (window.WG_sound) window.WG_sound.setMuted(m);
        updateMuteIcon();
        if (!m) sfx("click");
      });
    }

    // Enter 鍵：作答中→送出；已送出→下一題（輸入法組字中的 Enter 不觸發）
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || e.isComposing || state.composing) return;
      if (screens.game.hidden) return;
      e.preventDefault();
      if (state.submitted) nextRound();
      else submitAnswers(false);
    });
  }

  // ---- 啟動 ----
  function init() {
    buildDifficultyButtons();
    bindGlobalEvents();
    showScreen("start");
  }

  init();
})();
