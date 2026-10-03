/* =====================================================================
 * Kartu Persamaan — logika permainan
 * Mekanik: ketuk kartu -> ketuk slot. Semua susunan yang hasilnya tepat
 * dinilai benar (divalidasi dengan aritmetika pecahan eksak).
 * ===================================================================== */
'use strict';

/* Format angka gaya Indonesia: 12000 -> "12.000" */
function fmt(n) {
  return Number(n).toLocaleString('id-ID');
}

(function () {
  function $(id) { return document.getElementById(id); }

  var SCREENS = ['screen-start', 'screen-levels', 'screen-game',
                 'screen-result', 'screen-victory'];

  function show(id) {
    for (var i = 0; i < SCREENS.length; i++) {
      $(SCREENS[i]).classList.toggle('active', SCREENS[i] === id);
    }
    window.scrollTo(0, 0);
  }

  /* ---------- progres tersimpan ---------- */
  var store = {
    load: function () {
      try {
        return JSON.parse(localStorage.getItem('kartuPersamaan')) ||
               { unlocked: 1, best: {}, muted: false };
      } catch (e) {
        return { unlocked: 1, best: {}, muted: false };
      }
    },
    save: function (d) {
      try { localStorage.setItem('kartuPersamaan', JSON.stringify(d)); } catch (e) {}
    }
  };
  var progress = store.load();
  Sfx.setMuted(!!progress.muted);

  var state = null;   /* { cfg, puzzles, idx, score, lives, combo, correct, answered, timerId, timeLeft } */
  var board = null;   /* { p, placed:[], hand:[], selectedCid, locked } */

  /* ---------- pilih level ---------- */
  function renderLevels() {
    var grid = $('level-grid');
    grid.innerHTML = '';
    LEVELS.forEach(function (lv) {
      var locked = lv.id > progress.unlocked;
      var best = progress.best[lv.id];
      var card = document.createElement('button');
      card.className = 'level-card' + (locked ? ' locked' : '');
      card.innerHTML =
        '<div class="lv-icon">' + lv.icon + '</div>' +
        '<div class="lv-name">Level ' + lv.id + ': ' + lv.name + '</div>' +
        '<div class="lv-desc">' + lv.desc + ' &bull; ' + lv.count +
          ' soal &bull; ' + lv.time + ' detik/soal</div>' +
        (best ? '<div class="lv-best">⭐ Skor terbaik: ' + fmt(best) + '</div>' : '') +
        (locked ? '<div class="lv-lock">🔒 Selesaikan level sebelumnya untuk membuka</div>' : '');
      if (!locked) {
        card.addEventListener('click', function () {
          Sfx.click();
          startLevel(lv.id);
        });
      }
      grid.appendChild(card);
    });
  }

  /* ---------- mulai level ---------- */
  function startLevel(id) {
    var cfg = LEVELS[id - 1];
    state = {
      cfg: cfg,
      puzzles: genPuzzle(id),
      idx: 0,
      score: 0,
      lives: 3,
      combo: 0,
      correct: 0,
      answered: false,
      timerId: null,
      timeLeft: cfg.time
    };
    show('screen-game');
    renderPuzzle();
  }

  /* ---------- render puzzle ---------- */
  function renderPuzzle() {
    var p = state.puzzles[state.idx];
    board = {
      p: p,
      placed: p.slotKinds.map(function () { return null; }),
      hand: p.cards.slice(),
      selectedCid: null,
      locked: false
    };
    state.answered = false;
    $('hud-level').textContent = state.cfg.id;
    updateLives();
    $('hud-combo').textContent = state.combo > 1 ? 'x' + state.combo : '–';
    $('hud-score').textContent = fmt(state.score);
    $('q-progress').textContent = 'Soal ' + (state.idx + 1) + '/' + state.puzzles.length;
    $('feedback').classList.add('hidden');
    renderBoard();
    startTimer();
  }

  function updateLives() {
    $('hud-lives').textContent = '❤️'.repeat(state.lives) + '🖤'.repeat(3 - state.lives);
  }

  function renderBoard() {
    renderEquation();
    renderHand();
    updateCheckBtn();
  }

  function renderEquation() {
    var p = board.p;
    var eq = $('equation');
    eq.innerHTML = '';
    var si = 0, fi = 0;

    function addSlot(kind) {
      (function (idx) {
        var b = document.createElement('button');
        b.className = 'slot' + (kind === 'op' ? ' op-slot' : '');
        b.setAttribute('data-slot', idx);
        var card = board.placed[idx];
        if (card) {
          b.textContent = card.label;
          b.classList.add('filled');
        } else {
          b.innerHTML = '<span style="opacity:.35">?</span>';
          if (board.selectedCid) {
            var sc = findInHand(board.selectedCid);
            if (sc && sc.kind === kind) b.classList.add('aim');
          }
        }
        b.disabled = board.locked;
        b.addEventListener('click', function () { onSlotTap(idx); });
        eq.appendChild(b);
      })(si);
      si++;
    }
    function addOp(op) {
      var s = document.createElement('span');
      s.className = 'eq-op';
      s.textContent = opPretty(op);
      eq.appendChild(s);
    }
    function addTxt(cls, txt) {
      var s = document.createElement('span');
      s.className = cls;
      s.textContent = txt;
      eq.appendChild(s);
    }

    if (p.shape === 'paren') {
      addTxt('eq-paren', '(');
      addSlot('num'); addOp(p.fixedOps[0]); addSlot('num');
      addTxt('eq-paren', ')');
      addOp(p.fixedOps[1]); addSlot('num');
    } else {
      for (var i = 0; i < p.slotKinds.length; i++) {
        if (p.slotKinds[i] === 'num') {
          addSlot('num');
          if (fi < p.fixedOps.length) { addOp(p.fixedOps[fi]); fi++; }
        } else {
          addSlot('op');
        }
      }
    }
    addTxt('eq-eq', '=');
    var t = document.createElement('span');
    t.className = 'eq-target';
    t.textContent = flabel(p.targetF);
    eq.appendChild(t);
  }

  function renderHand() {
    var hand = $('hand');
    hand.innerHTML = '';
    if (board.hand.length === 0) {
      hand.innerHTML = '<span class="hand-empty">Semua kartu sudah terpasang.</span>';
      return;
    }
    board.hand.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'playing-card' + (c.kind === 'op' ? ' opcard' : '') +
                    (board.selectedCid === c.cid ? ' selected' : '');
      b.setAttribute('data-cid', c.cid);
      b.textContent = c.label;
      b.disabled = board.locked;
      b.addEventListener('click', function () { onCardTap(c.cid); });
      hand.appendChild(b);
    });
  }

  function findInHand(cid) {
    for (var i = 0; i < board.hand.length; i++) {
      if (board.hand[i].cid === cid) return board.hand[i];
    }
    return null;
  }

  function updateCheckBtn() {
    var complete = board.placed.every(function (c) { return !!c; });
    $('btn-check').disabled = !complete || board.locked;
  }

  /* ---------- interaksi ---------- */
  function onCardTap(cid) {
    if (board.locked) return;
    board.selectedCid = (board.selectedCid === cid) ? null : cid;
    Sfx.click();
    renderBoard();
  }

  function onSlotTap(i) {
    if (board.locked) return;
    var cur = board.placed[i];
    if (board.selectedCid) {
      var card = findInHand(board.selectedCid);
      if (!card) { board.selectedCid = null; renderBoard(); return; }
      if (card.kind !== board.p.slotKinds[i]) {
        /* jenis kartu tidak cocok dengan slot: abaikan */
        board.selectedCid = null;
        renderBoard();
        return;
      }
      if (cur) board.hand.push(cur);
      board.placed[i] = card;
      board.hand = board.hand.filter(function (c) { return c.cid !== card.cid; });
      board.selectedCid = null;
      Sfx.click();
    } else if (cur) {
      board.hand.push(cur);
      board.placed[i] = null;
      Sfx.click();
    } else {
      return;
    }
    renderBoard();
  }

  function onReset() {
    if (board.locked) return;
    for (var i = 0; i < board.placed.length; i++) {
      if (board.placed[i]) {
        board.hand.push(board.placed[i]);
        board.placed[i] = null;
      }
    }
    board.selectedCid = null;
    Sfx.click();
    renderBoard();
  }

  /* ---------- timer ---------- */
  function startTimer() {
    stopTimer();
    var total = state.cfg.time;
    state.timeLeft = total;
    var lastTick = -1;
    var fill = $('timer-fill');
    fill.style.width = '100%';
    fill.classList.remove('danger');
    state.timerId = setInterval(function () {
      state.timeLeft -= 0.1;
      var pct = Math.max(0, state.timeLeft / total * 100);
      fill.style.width = pct + '%';
      if (pct < 35) {
        fill.classList.add('danger');
        var sec = Math.ceil(state.timeLeft);
        if (sec <= 10 && sec !== lastTick && sec > 0) {
          lastTick = sec;
          Sfx.tick();
        }
      }
      if (state.timeLeft <= 0) {
        stopTimer();
        onTimeout();
      }
    }, 100);
  }

  function stopTimer() {
    if (state && state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function onTimeout() {
    if (state.answered) return;
    state.answered = true;
    board.locked = true;
    renderBoard();
    state.lives--;
    state.combo = 0;
    Sfx.wrong();
    updateLives();
    showFeedback(false, '⏰ Waktu habis!',
      'Waktu ' + state.cfg.time + ' detik sudah lewat. ' + board.p.explain);
  }

  /* ---------- periksa jawaban ---------- */
  function onCheck() {
    if (state.answered || board.locked) return;
    state.answered = true;
    stopTimer();
    board.locked = true;

    var r = evalPuzzle(board.p, board.placed);
    var title = $('fb-title');

    if (r === null) {
      state.lives--; state.combo = 0;
      Sfx.wrong();
      updateLives();
      showFeedback(false, '⛔ Tidak boleh!',
        'Susunanmu mengandung <b>pembagian dengan nol</b>, itu tidak diperbolehkan. ' +
        board.p.explain);
    } else if (feq(r, board.p.targetF)) {
      state.correct++;
      state.combo++;
      var bonus = state.combo >= 3 ? 50 * state.cfg.mult : 0;
      var pts = Math.round((100 + state.timeLeft * 2) * state.cfg.mult + bonus);
      state.score += pts;
      Sfx.correct();
      $('hud-combo').textContent = state.combo > 1 ? 'x' + state.combo : '–';
      $('hud-score').textContent = fmt(state.score);
      showFeedback(true,
        '✅ Benar! +' + fmt(pts) + (state.combo >= 3 ? '  (kombo x' + state.combo + ' 🔥)' : ''),
        board.p.explain);
    } else {
      state.lives--; state.combo = 0;
      Sfx.wrong();
      updateLives();
      showFeedback(false, '❌ Belum tepat',
        'Susunanmu menghasilkan <b>' + flabel(r) + '</b>, padahal targetnya ' +
        '<b>' + flabel(board.p.targetF) + '</b>. ' + board.p.explain);
    }
    renderBoard();
  }

  function showFeedback(ok, title, explainHtml) {
    var t = $('fb-title');
    t.textContent = title;
    t.className = 'fb-title ' + (ok ? 'ok' : 'bad');
    $('fb-explain').innerHTML = '<b>Pembahasan:</b> ' + explainHtml;
    $('feedback').classList.remove('hidden');
  }

  /* ---------- lanjut ---------- */
  function next() {
    Sfx.click();
    if (state.lives <= 0) { finish(false); return; }
    state.idx++;
    if (state.idx >= state.puzzles.length) {
      finish(state.correct >= state.cfg.pass);
    } else {
      renderPuzzle();
    }
  }

  /* ---------- selesai ---------- */
  function finish(passed) {
    stopTimer();
    var cfg = state.cfg;
    var isLast = cfg.id === LEVELS.length;

    if (passed) {
      var prevBest = progress.best[cfg.id] || 0;
      var newBest = state.score > prevBest;
      if (newBest) progress.best[cfg.id] = state.score;
      if (!isLast) progress.unlocked = Math.max(progress.unlocked, cfg.id + 1);
      store.save(progress);
      Sfx.win();

      if (isLast) {
        var totalBest = 0;
        for (var i = 0; i < LEVELS.length; i++) totalBest += progress.best[LEVELS[i].id] || 0;
        $('victory-stats').innerHTML =
          '<div class="stat-big">🏆</div>' +
          statRow('Level terakhir', state.correct + '/' + state.puzzles.length + ' benar') +
          statRow('Skor level ini', fmt(state.score)) +
          statRow('Total skor terbaik', fmt(totalBest)) +
          '<p class="stat-note">Kamu resmi menyandang gelar <b>Master Persamaan</b>! 🎓</p>';
        show('screen-victory');
        return;
      }

      $('res-title').textContent = '🎉 Level ' + cfg.id + ' Lolos!';
      $('res-stats').innerHTML =
        '<div class="stat-big">' + cfg.icon + '</div>' +
        statRow('Jawaban benar', state.correct + ' / ' + state.puzzles.length) +
        statRow('Skor', fmt(state.score)) +
        (newBest ? statRow('Rekor', '⭐ Rekor baru!') :
                   statRow('Skor terbaik', fmt(prevBest))) +
        '<p class="stat-note">Level ' + (cfg.id + 1) + ': <b>' +
          LEVELS[cfg.id].name + '</b> telah terbuka! 🔓</p>';
      $('btn-next-level').style.display = '';
    } else {
      $('res-title').textContent = state.lives <= 0 ? '💔 Nyawa Habis' : '😅 Belum Lolos';
      $('res-stats').innerHTML =
        '<div class="stat-big">' + (state.lives <= 0 ? '💔' : '📚') + '</div>' +
        statRow('Jawaban benar', state.correct + ' / ' + state.puzzles.length) +
        statRow('Syarat lolos', 'minimal ' + cfg.pass + ' benar') +
        statRow('Skor', fmt(state.score)) +
        '<p class="stat-note">Jangan menyerah! Pelajari pembahasan tiap soal, lalu coba lagi. 💪</p>';
      $('btn-next-level').style.display = 'none';
    }
    show('screen-result');
  }

  function statRow(label, value) {
    return '<div class="stat-row"><span>' + label + '</span><b>' + value + '</b></div>';
  }

  /* ---------- wiring ---------- */
  $('btn-start').addEventListener('click', function () {
    Sfx.click();
    renderLevels();
    show('screen-levels');
  });
  $('btn-back-start').addEventListener('click', function () {
    Sfx.click();
    show('screen-start');
  });
  $('btn-quit').addEventListener('click', function () {
    Sfx.click();
    stopTimer();
    renderLevels();
    show('screen-levels');
  });
  $('btn-check').addEventListener('click', onCheck);
  $('btn-reset').addEventListener('click', onReset);
  $('btn-next').addEventListener('click', next);
  $('btn-retry').addEventListener('click', function () {
    Sfx.click();
    startLevel(state.cfg.id);
  });
  $('btn-next-level').addEventListener('click', function () {
    Sfx.click();
    startLevel(state.cfg.id + 1);
  });
  $('btn-to-levels').addEventListener('click', function () {
    Sfx.click();
    renderLevels();
    show('screen-levels');
  });
  $('btn-again').addEventListener('click', function () {
    Sfx.click();
    renderLevels();
    show('screen-levels');
  });
  $('btn-victory-levels').addEventListener('click', function () {
    Sfx.click();
    renderLevels();
    show('screen-levels');
  });

  function refreshMuteBtn() {
    $('btn-mute').textContent = Sfx.isMuted() ? '🔇 Suara: Mati' : '🔊 Suara: Nyala';
  }
  $('btn-mute').addEventListener('click', function () {
    var m = !Sfx.isMuted();
    Sfx.setMuted(m);
    progress.muted = m;
    store.save(progress);
    refreshMuteBtn();
    if (!m) Sfx.click();
  });
  refreshMuteBtn();

  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
})();
