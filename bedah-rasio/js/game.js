/* =====================================================================
 * Bedah Rasio — mesin eksplorasi interaktif
 * Dua mode: Lab Klasifikasi & Arena Banding. Tanpa timer, tanpa nyawa —
 * fokus memahami konsep lewat umpan balik langsung.
 * ===================================================================== */
'use strict';

(function () {
  function $(id) { return document.getElementById(id); }

  var SCREENS = ['screen-start', 'screen-play', 'screen-done'];
  function show(id) {
    SCREENS.forEach(function (s) { $(s).classList.toggle('active', s === id); });
    window.scrollTo(0, 0);
  }

  function shuffle(a) {
    var x = a.slice();
    for (var i = x.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = x[i]; x[i] = x[j]; x[j] = t;
    }
    return x;
  }

  var store = {
    load: function () {
      try { return JSON.parse(localStorage.getItem('bedahRasio')) || { lab: 0, arena: 0, muted: false }; }
      catch (e) { return { lab: 0, arena: 0, muted: false }; }
    },
    save: function (d) { try { localStorage.setItem('bedahRasio', JSON.stringify(d)); } catch (e) {} }
  };
  var progress = store.load();
  Sfx.setMuted(!!progress.muted);

  var state = null; /* { mode, items, idx, correct, answered } */

  function renderStart() {
    ['lab', 'arena'].forEach(function (m) {
      var n = Math.max(0, Math.min(3, progress[m] || 0));
      var el = $('stars-' + m);
      if (el) el.textContent = '★'.repeat(n) + '☆'.repeat(3 - n);
    });
  }

  function startMode(mode) {
    Sfx.click();
    var items = shuffle(mode === 'lab' ? LAB_ITEMS : ARENA_ITEMS);
    state = { mode: mode, items: items, idx: 0, correct: 0, answered: false };
    $('play-title').textContent = mode === 'lab' ? '🔬 Lab Klasifikasi' : '⚖️ Arena Banding';
    show('screen-play');
    renderItem();
  }

  function renderItem() {
    var it = state.items[state.idx];
    state.answered = false;
    $('p-progress').textContent =
      (state.mode === 'lab' ? 'Kasus ' : 'Duel ') + (state.idx + 1) + '/' + state.items.length;
    $('p-context').textContent = it.ctx;
    var body = $('p-body');
    body.innerHTML = '';
    if (state.mode === 'lab') {
      body.innerHTML =
        '<div class="pair-box"><div class="pair-title">Keadaan 1</div>' +
        '<div class="pair-vals">' + it.p1[0] + ' &bull; ' + it.p1[1] + '</div></div>' +
        '<div class="pair-box"><div class="pair-title">Keadaan 2</div>' +
        '<div class="pair-vals">' + it.p2[0] + ' &bull; ' + it.p2[1] + '</div></div>' +
        '<p class="q-ask">Hubungan kedua keadaan ini tergolong …</p>';
    } else {
      body.innerHTML =
        '<div class="vs-row">' +
        '<div class="ratio-card"><div class="ratio-big">' + it.r1t + '</div>' +
        '<div class="ratio-desc">' + it.r1d + '</div></div>' +
        '<div class="vs">VS</div>' +
        '<div class="ratio-card"><div class="ratio-big">' + it.r2t + '</div>' +
        '<div class="ratio-desc">' + it.r2d + '</div></div>' +
        '</div>' +
        '<p class="q-ask">Manakah yang lebih besar?</p>';
    }
    var box = $('p-choices');
    box.innerHTML = '';
    var choices = state.mode === 'lab' ? LAB_CHOICES : ARENA_CHOICES;
    choices.forEach(function (c, i) {
      var b = document.createElement('button');
      b.className = 'choice';
      b.textContent = c;
      b.addEventListener('click', function () { answer(i, b); });
      box.appendChild(b);
    });
    $('feedback').classList.add('hidden');
  }

  function answer(i, btn) {
    if (!state || state.answered) return;
    state.answered = true;
    var it = state.items[state.idx];
    var correctIdx = state.mode === 'lab' ? labAnswerIndex(it) : arenaAnswerIndex(it);
    var ok = (i === correctIdx);
    var buttons = $('p-choices').children;
    for (var k = 0; k < buttons.length; k++) {
      buttons[k].disabled = true;
      if (k === correctIdx) buttons[k].classList.add('correct');
    }
    if (btn && !ok) btn.classList.add('wrong');
    if (ok) { state.correct++; Sfx.correct(); } else { Sfx.wrong(); }
    var t = $('fb-title');
    t.textContent = ok ? '✅ Tepat!' : '❌ Kurang tepat';
    t.className = 'fb-title ' + (ok ? 'ok' : 'bad');
    $('fb-explain').innerHTML = '<b>Pembahasan:</b> ' + it.explain;
    $('feedback').classList.remove('hidden');
  }

  function next() {
    Sfx.click();
    state.idx++;
    if (state.idx >= state.items.length) finish();
    else renderItem();
  }

  function finish() {
    var n = state.items.length, c = state.correct;
    var stars = c >= 7 ? 3 : c >= 5 ? 2 : c >= 3 ? 1 : 0;
    if (stars > (progress[state.mode] || 0)) {
      progress[state.mode] = stars;
      store.save(progress);
    }
    Sfx.win();
    $('done-title').textContent =
      '🎉 ' + (state.mode === 'lab' ? 'Lab Selesai!' : 'Arena Selesai!');
    $('done-stats').innerHTML =
      '<div class="stat-big">' + (state.mode === 'lab' ? '🔬' : '⚖️') + '</div>' +
      statRow('Jawaban tepat', c + ' / ' + n) +
      statRow('Bintang', '★'.repeat(stars) + '☆'.repeat(3 - stars)) +
      '<p class="stat-note">' +
      (stars === 3 ? 'Sempurna! Kamu <b>Ahli Bedah Rasio</b>! 🎓'
                   : 'Pelajari lagi pembahasannya, lalu coba raih 3 bintang! 💪') +
      '</p>';
    show('screen-done');
  }

  function statRow(label, value) {
    return '<div class="stat-row"><span>' + label + '</span><b>' + value + '</b></div>';
  }

  $('btn-lab').addEventListener('click', function () { startMode('lab'); });
  $('btn-arena').addEventListener('click', function () { startMode('arena'); });
  $('btn-next').addEventListener('click', next);
  $('btn-done-retry').addEventListener('click', function () { startMode(state.mode); });
  $('btn-done-modes').addEventListener('click', function () {
    Sfx.click();
    renderStart();
    show('screen-start');
  });
  $('btn-back-start').addEventListener('click', function () {
    Sfx.click();
    show('screen-start');
  });

  function refreshMuteBtn() {
    $('btn-mute').textContent = Sfx.isMuted() ? '🔇 Suara: Mati' : '🔊 Suara: Nyala';
  }
  $('btn-mute').addEventListener('click', function () {
    var m = !Sfx.isMuted();
    Sfx.setMuted(m); progress.muted = m; store.save(progress);
    refreshMuteBtn();
    if (!m) Sfx.click();
  });
  refreshMuteBtn();

  /* suntik materi konsep */
  $('konsep-lab').innerHTML = KONSEP_LAB;
  $('konsep-arena').innerHTML = KONSEP_ARENA;
  renderStart();

  document.addEventListener('dblclick', function (e) { e.preventDefault(); }, { passive: false });
})();
