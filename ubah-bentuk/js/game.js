/* =====================================================================
 * Ubah Bentuk — logika permainan
 * ===================================================================== */
'use strict';

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
        return JSON.parse(localStorage.getItem('ubahBentuk')) ||
               { unlocked: 1, best: {}, muted: false };
      } catch (e) {
        return { unlocked: 1, best: {}, muted: false };
      }
    },
    save: function (d) {
      try { localStorage.setItem('ubahBentuk', JSON.stringify(d)); } catch (e) {}
    }
  };
  var progress = store.load();
  Sfx.setMuted(!!progress.muted);

  var state = null; /* { cfg, qs, idx, score, lives, combo, correct, answered, timerId, timeLeft, lastTick } */

  /* ---------- layar: pilih level ---------- */
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
      qs: genQuestions(id),
      idx: 0,
      score: 0,
      lives: 3,
      combo: 0,
      correct: 0,
      answered: false,
      timerId: null,
      timeLeft: cfg.time,
      lastTick: -1
    };
    show('screen-game');
    renderQuestion();
  }

  /* ---------- render soal ---------- */
  function renderQuestion() {
    var q = state.qs[state.idx];
    var cfg = state.cfg;

    $('hud-level').textContent = state.cfg.id;
    updateLives();
    $('hud-combo').textContent = state.combo > 1 ? 'x' + state.combo : '–';
    $('hud-score').textContent = fmt(state.score);
    $('q-progress').textContent = 'Soal ' + (state.idx + 1) + '/' + state.qs.length;
    $('q-prompt').innerHTML = q.prompt;

    var box = $('q-choices');
    box.innerHTML = '';
    q.choices.forEach(function (c, i) {
      var b = document.createElement('button');
      b.className = 'choice';
      b.innerHTML = c;
      b.addEventListener('click', function () { answer(i, b); });
      box.appendChild(b);
    });

    $('feedback').classList.add('hidden');
    startTimer();
  }

  function updateLives() {
    $('hud-lives').textContent = '❤️'.repeat(state.lives) + '🖤'.repeat(3 - state.lives);
  }

  /* ---------- timer ---------- */
  function startTimer() {
    stopTimer();
    var total = state.cfg.time;
    state.timeLeft = total;
    state.lastTick = -1;
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
        if (sec <= 5 && sec !== state.lastTick && sec > 0) {
          state.lastTick = sec;
          Sfx.tick();
        }
      }
      if (state.timeLeft <= 0) {
        stopTimer();
        answer(-1, null); /* waktu habis */
      }
    }, 100);
  }

  function stopTimer() {
    if (state && state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  /* ---------- jawab ---------- */
  function answer(i, btn) {
    if (!state || state.answered) return;
    state.answered = true;
    stopTimer();

    var q = state.qs[state.idx];
    var ok = (i === q.answer);
    var buttons = $('q-choices').children;
    for (var k = 0; k < buttons.length; k++) {
      buttons[k].disabled = true;
      if (k === q.answer) buttons[k].classList.add('correct');
    }
    if (btn && !ok) btn.classList.add('wrong');

    var title = $('fb-title');
    if (ok) {
      state.correct++;
      state.combo++;
      var bonus = state.combo >= 3 ? 50 * state.cfg.mult : 0;
      var pts = Math.round((100 + state.timeLeft * 5) * state.cfg.mult + bonus);
      state.score += pts;
      Sfx.correct();
      title.textContent = '✅ Benar! +' + fmt(pts) +
        (state.combo >= 3 ? '  (kombo x' + state.combo + ' 🔥)' : '');
      title.className = 'fb-title ok';
    } else {
      state.lives--;
      state.combo = 0;
      Sfx.wrong();
      title.textContent = (i === -1) ? '⏰ Waktu habis!' : '❌ Kurang tepat';
      title.className = 'fb-title bad';
      updateLives();
    }
    $('hud-combo').textContent = state.combo > 1 ? 'x' + state.combo : '–';
    $('hud-score').textContent = fmt(state.score);
    $('fb-explain').innerHTML = '<b>Pembahasan:</b> ' + q.explain;
    $('feedback').classList.remove('hidden');
  }

  /* ---------- lanjut ---------- */
  function next() {
    Sfx.click();
    if (state.lives <= 0) { finish(false); return; }
    state.idx++;
    state.answered = false;
    if (state.idx >= state.qs.length) {
      finish(state.correct >= state.cfg.pass);
    } else {
      renderQuestion();
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
          statRow('Level terakhir', state.correct + '/' + state.qs.length + ' benar') +
          statRow('Skor level ini', fmt(state.score)) +
          statRow('Total skor terbaik', fmt(totalBest)) +
          '<p class="stat-note">Kamu resmi menyandang gelar <b>Master Ubah Bentuk</b>! 🎓</p>';
        show('screen-victory');
        return;
      }

      $('res-title').textContent = '🎉 Level ' + cfg.id + ' Lolos!';
      $('res-stats').innerHTML =
        '<div class="stat-big">' + cfg.icon + '</div>' +
        statRow('Jawaban benar', state.correct + ' / ' + state.qs.length) +
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
        statRow('Jawaban benar', state.correct + ' / ' + state.qs.length) +
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

  /* ---------- wiring tombol ---------- */
  $('btn-start').addEventListener('click', function () {
    Sfx.click();
    renderLevels();
    show('screen-levels');
  });
  $('btn-back-start').addEventListener('click', function () {
    Sfx.click();
    show('screen-start');
  });
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

  /* cegah double-tap zoom di perangkat sentuh */
  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
})();
