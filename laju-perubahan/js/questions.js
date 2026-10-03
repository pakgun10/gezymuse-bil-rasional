/* =====================================================================
 * Laju Perubahan — bank soal & generator
 * Game Matematika SMP • Materi: laju perubahan (kecepatan, debit,
 * membaca tabel & grafik jarak-waktu). Murni JavaScript, tanpa dependensi.
 * Bisa diuji dengan Node.
 * ===================================================================== */
'use strict';

/* ---------------- util ---------------- */

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function shuffle(a) {
  var x = a.slice();
  for (var i = x.length - 1; i > 0; i--) {
    var j = rand(0, i);
    var t = x[i]; x[i] = x[j]; x[j] = t;
  }
  return x;
}

/* Format angka gaya Indonesia: 1200 -> "1.200" (dipakai game.js) */
function fmt(n) {
  return Number(n).toLocaleString('id-ID');
}

/* Ambil angka dari awal string: "1.200 km" -> 1200, "60 km/jam" -> 60 */
function parseNum(s) {
  var m = String(s).trim().match(/^([\d\.]+)/);
  if (!m) return NaN;
  return Number(m[1].replace(/\./g, ''));
}

/* ---------------- pembangun soal ---------------- */

function makeQ(prompt, correct, distractors, explain, meta) {
  correct = String(correct);
  var seen = {};
  seen[correct] = true;
  var ds = [];
  var pool = shuffle(distractors.map(String));
  for (var i = 0; i < pool.length && ds.length < 3; i++) {
    if (!seen[pool[i]]) { seen[pool[i]] = true; ds.push(pool[i]); }
  }
  var guard = 0;
  while (ds.length < 3 && guard++ < 80) {
    var f = correct + ' ?';
    if (!seen[f]) { seen[f] = true; ds.push(f); }
  }
  var choices = shuffle([correct].concat(ds));
  return {
    prompt: prompt,
    choices: choices,
    answer: choices.indexOf(correct),
    explain: explain,
    meta: meta || null
  };
}

function collect(n, gens) {
  var qs = [];
  var seen = {};
  var guard = 0;
  while (qs.length < n && guard++ < n * 80) {
    var q = pick(gens)();
    if (!seen[q.prompt]) { seen[q.prompt] = true; qs.push(q); }
  }
  return qs;
}

function numDistractors(ans, traps) {
  var out = [];
  [ans * 2, ans / 2, ans + 10, ans - 10, ans + 5, ans - 5,
   Math.round(ans * 1.1), Math.round(ans * 0.9)].forEach(function (c) {
    if (c > 0 && Math.round(c) === c) out.push(fmt(c));
  });
  var seen = {};
  var res = [];
  traps.concat(out).forEach(function (s) {
    if (!seen[s]) { seen[s] = true; res.push(s); }
  });
  return res;
}

function withUnit(n, unit) {
  return fmt(n) + ' ' + unit;
}

/* ---------------- LEVEL 1: Kecepatan ---------------- */

var KENDARAAN = ['Mobil', 'Bus', 'Kereta api', 'Sepeda motor'];

function qKecepatan() {
  var v = pick([30, 40, 50, 60, 80]);
  var t = pick([2, 3, 4, 5]);
  var s = v * t;
  var k = pick(KENDARAAN);
  var variant = pick(['v', 's', 't']);
  if (variant === 'v') {
    return makeQ(
      k + ' menempuh <b>' + fmt(s) + ' km</b> dalam <b>' + t + ' jam</b>. Berapa kecepatannya?',
      withUnit(v, 'km/jam'),
      numDistractors(v, [fmt(s), fmt(t), fmt(s + t)]).map(function (x) { return x + ' km/jam'; }),
      'Kecepatan = jarak ÷ waktu = ' + fmt(s) + ' ÷ ' + t + ' = <b>' + fmt(v) + ' km/jam</b>.',
      { kind: 'v', ans: v }
    );
  }
  if (variant === 's') {
    return makeQ(
      k + ' melaju <b>' + fmt(v) + ' km/jam</b> selama <b>' + t + ' jam</b>. Berapa jarak yang ditempuh?',
      withUnit(s, 'km'),
      numDistractors(s, [fmt(v), fmt(t), fmt(v + t)]).map(function (x) { return x + ' km'; }),
      'Jarak = kecepatan × waktu = ' + fmt(v) + ' × ' + t + ' = <b>' + fmt(s) + ' km</b>.',
      { kind: 's', ans: s }
    );
  }
  return makeQ(
    k + ' menempuh <b>' + fmt(s) + ' km</b> dengan kecepatan <b>' + fmt(v) + ' km/jam</b>. Berapa lama perjalanannya?',
    withUnit(t, 'jam'),
    numDistractors(t, [fmt(v), fmt(s)]).map(function (x) { return x + ' jam'; }),
    'Waktu = jarak ÷ kecepatan = ' + fmt(s) + ' ÷ ' + fmt(v) + ' = <b>' + t + ' jam</b>.',
    { kind: 't', ans: t }
  );
}

/* ---------------- LEVEL 2: Debit ---------------- */

var SUMBER = ['Keran', 'Pipa', 'Pompa air', 'Selang'];

function qDebit() {
  var q = pick([5, 10, 15, 20, 25]);
  var t = pick([2, 3, 4, 5, 6, 10]);
  var V = q * t;
  var src = pick(SUMBER);
  var variant = pick(['q', 'V', 't']);
  if (variant === 'q') {
    return makeQ(
      src + ' mengisi <b>' + fmt(V) + ' liter</b> dalam <b>' + t + ' menit</b>. Berapa debitnya?',
      withUnit(q, 'liter/menit'),
      numDistractors(q, [fmt(V), fmt(t)]).map(function (x) { return x + ' liter/menit'; }),
      'Debit = volume ÷ waktu = ' + fmt(V) + ' ÷ ' + t + ' = <b>' + fmt(q) + ' liter/menit</b>.',
      { kind: 'q', ans: q }
    );
  }
  if (variant === 'V') {
    return makeQ(
      'Air mengalir dengan debit <b>' + fmt(q) + ' liter/menit</b> selama <b>' + t + ' menit</b>. Berapa volume airnya?',
      withUnit(V, 'liter'),
      numDistractors(V, [fmt(q), fmt(t)]).map(function (x) { return x + ' liter'; }),
      'Volume = debit × waktu = ' + fmt(q) + ' × ' + t + ' = <b>' + fmt(V) + ' liter</b>.',
      { kind: 'V', ans: V }
    );
  }
  return makeQ(
    'Bak <b>' + fmt(V) + ' liter</b> diisi dengan debit <b>' + fmt(q) + ' liter/menit</b>. Berapa menit waktu yang dibutuhkan?',
    withUnit(t, 'menit'),
    numDistractors(t, [fmt(q), fmt(V)]).map(function (x) { return x + ' menit'; }),
    'Waktu = volume ÷ debit = ' + fmt(V) + ' ÷ ' + fmt(q) + ' = <b>' + t + ' menit</b>.',
    { kind: 't', ans: t }
  );
}

/* ---------------- LEVEL 3: Tabel ---------------- */

function tabelHTML(v, missingK) {
  var h = '<table class="mini-table"><tr><th>Waktu (jam)</th>';
  for (var i = 1; i <= 4; i++) h += '<td>' + i + '</td>';
  h += '</tr><tr><th>Jarak (km)</th>';
  for (var j = 1; j <= 4; j++) h += '<td>' + (j === missingK ? '?' : fmt(v * j)) + '</td>';
  return h + '</tr></table>';
}

function qTabel() {
  var v = pick([30, 40, 50, 60]);
  if (Math.random() < 0.5) {
    var k = pick([2, 3, 4]);
    return makeQ(
      'Perhatikan tabel perjalanan Andi:' + tabelHTML(v, k) +
      'Berapa jarak yang ditempuh Andi setelah <b>' + k + ' jam</b>?',
      withUnit(v * k, 'km'),
      numDistractors(v * k, [fmt(v), fmt(k)]).map(function (x) { return x + ' km'; }),
      'Tabel berpola tetap: tiap jam bertambah ' + fmt(v) + ' km. ' +
      'Jarak setelah ' + k + ' jam = ' + fmt(v) + ' × ' + k + ' = <b>' + fmt(v * k) + ' km</b>.',
      { kind: 'tabel', ans: v * k }
    );
  }
  return makeQ(
    'Perhatikan tabel perjalanan Andi:' + tabelHTML(v, 0) +
    'Dari tabel di atas, berapa kecepatan Andi?',
    withUnit(v, 'km/jam'),
    numDistractors(v, [fmt(v * 2), fmt(4)]).map(function (x) { return x + ' km/jam'; }),
    'Kecepatan = jarak ÷ waktu, misalnya ' + fmt(v) + ' km ÷ 1 jam = <b>' + fmt(v) + ' km/jam</b>.',
    { kind: 'tabel', ans: v }
  );
}

/* ---------------- LEVEL 4: Grafik ---------------- */

/* Bulatkan batas sumbu-Y agar labelnya bagus: kelipatan 120 dipertahankan,
 * sisanya dibulatkan ke atas ke ratusan. */
function niceYmax(s) {
  return s % 120 === 0 ? s : Math.ceil(s / 100) * 100;
}

function svgGrafik(lines, xmax, ymax) {
  var W = 320, H = 220, P = 38;
  function X(t) { return P + t / xmax * (W - 2 * P); }
  function Y(s) { return H - P - s / ymax * (H - 2 * P); }
  var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="grafik" role="img">';
  var t, s;
  for (t = 0; t <= xmax; t++) {
    g += '<line x1="' + X(t).toFixed(1) + '" y1="' + P + '" x2="' + X(t).toFixed(1) +
         '" y2="' + (H - P) + '" class="grid"/>' +
         '<text x="' + X(t).toFixed(1) + '" y="' + (H - P + 16) + '" class="glabel" text-anchor="middle">' + t + '</text>';
  }
  var step = ymax / 4;
  for (s = 0; s <= ymax + 0.001; s += step) {
    g += '<line x1="' + P + '" y1="' + Y(s).toFixed(1) + '" x2="' + (W - P) +
         '" y2="' + Y(s).toFixed(1) + '" class="grid"/>' +
         '<text x="' + (P - 6) + '" y="' + (Y(s) + 4).toFixed(1) + '" class="glabel" text-anchor="end">' + Math.round(s) + '</text>';
  }
  g += '<line x1="' + P + '" y1="' + P + '" x2="' + P + '" y2="' + (H - P) + '" class="axis"/>' +
       '<line x1="' + P + '" y1="' + (H - P) + '" x2="' + (W - P) + '" y2="' + (H - P) + '" class="axis"/>' +
       '<text x="' + (W - P + 4) + '" y="' + (H - P + 4) + '" class="glabel">jam</text>' +
       '<text x="6" y="' + (P - 8) + '" class="glabel">km</text>';
  lines.forEach(function (ln) {
    var d = ln.pts.map(function (p, i) {
      return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1);
    }).join(' ');
    g += '<path d="' + d + '" class="gline" style="stroke:' + ln.color + '"/>';
    ln.pts.forEach(function (p) {
      g += '<circle cx="' + X(p[0]).toFixed(1) + '" cy="' + Y(p[1]).toFixed(1) +
           '" r="4" style="fill:' + ln.color + '"/>';
    });
    var last = ln.pts[ln.pts.length - 1];
    g += '<text x="' + (X(last[0]) + 8).toFixed(1) + '" y="' + (Y(last[1]) + 4).toFixed(1) +
         '" class="glabel" style="fill:' + ln.color + ';font-weight:700">' + ln.label + '</text>';
  });
  return g + '</svg>';
}

function qGrafik() {
  var variant = pick(['speed1', 'faster', 'speedX']);
  if (variant === 'speed1') {
    var v = pick([30, 40, 50, 60, 80, 100]);
    var t = pick([3, 4, 5]), s = v * t;
    var g = svgGrafik([{ pts: [[0, 0], [t, s]], label: 'Budi', color: '#7bf1a8' }], t, niceYmax(s));
    return makeQ(
      'Grafik jarak-waktu perjalanan Budi:' + g + 'Berapa kecepatan Budi?',
      withUnit(v, 'km/jam'),
      numDistractors(v, [fmt(s), fmt(t)]).map(function (x) { return x + ' km/jam'; }),
      'Kecepatan = kemiringan garis = ' + fmt(s) + ' km ÷ ' + t + ' jam = <b>' + fmt(v) + ' km/jam</b>.',
      { kind: 'grafik', ans: v, svg: true }
    );
  }
  /* dua garis lurus dari titik (0,0): yang lebih curam = lebih cepat */
  var cfg = pick([
    { s: 240, tFast: 4, tSlow: 6 },  /* 60 vs 40 */
    { s: 180, tFast: 3, tSlow: 6 },  /* 60 vs 30 */
    { s: 300, tFast: 5, tSlow: 6 },  /* 60 vs 50 */
    { s: 200, tFast: 4, tSlow: 5 }   /* 50 vs 40 */
  ]);
  var fastLabel = pick(['A', 'B']);
  var slowLabel = fastLabel === 'A' ? 'B' : 'A';
  var tA = fastLabel === 'A' ? cfg.tFast : cfg.tSlow;
  var tB = fastLabel === 'A' ? cfg.tSlow : cfg.tFast;
  var vFast = cfg.s / cfg.tFast, vSlow = cfg.s / cfg.tSlow;
  var g2 = svgGrafik([
    { pts: [[0, 0], [tA, cfg.s]], label: 'A', color: '#7bf1a8' },
    { pts: [[0, 0], [tB, cfg.s]], label: 'B', color: '#ff8fa3' }
  ], cfg.tSlow, niceYmax(cfg.s));
  if (variant === 'faster') {
    return makeQ(
      'Grafik perjalanan A dan B (jarak-waktu):' + g2 + 'Siapa yang lebih cepat?',
      fastLabel,
      [slowLabel, 'Sama cepat', 'Tidak bisa ditentukan'],
      'Garis ' + fastLabel + ' lebih curam: menempuh ' + fmt(cfg.s) + ' km dalam ' + cfg.tFast +
      ' jam (' + fmt(vFast) + ' km/jam), sedangkan ' + slowLabel + ' dalam ' + cfg.tSlow +
      ' jam (' + fmt(vSlow) + ' km/jam). → <b>' + fastLabel + ' lebih cepat</b>.',
      { kind: 'grafik', ans: fastLabel, str: true, svg: true }
    );
  }
  var targetIsFast = Math.random() < 0.5;
  var vT = targetIsFast ? vFast : vSlow;
  var tT = targetIsFast ? cfg.tFast : cfg.tSlow;
  var labelT = targetIsFast ? fastLabel : slowLabel;
  return makeQ(
    'Grafik perjalanan A dan B (jarak-waktu):' + g2 + 'Berapa kecepatan ' + labelT + '?',
    withUnit(vT, 'km/jam'),
    numDistractors(vT, [fmt(vFast), fmt(vSlow)]).map(function (x) { return x + ' km/jam'; }),
    'Kecepatan ' + labelT + ' = ' + fmt(cfg.s) + ' km ÷ ' + tT + ' jam = <b>' + fmt(vT) + ' km/jam</b>.',
    { kind: 'grafik', ans: vT, svg: true }
  );
}

/* ---------------- konfigurasi level ---------------- */

var LEVELS = [
  { id: 1, name: 'Start! Kecepatan', desc: 'Kecepatan = jarak ÷ waktu', time: 40, count: 6, pass: 4, mult: 1, icon: '🏁' },
  { id: 2, name: 'Debit Air', desc: 'Debit = volume ÷ waktu', time: 40, count: 6, pass: 4, mult: 2, icon: '💧' },
  { id: 3, name: 'Tabel Kecepatan', desc: 'Baca pola tabel', time: 35, count: 6, pass: 4, mult: 3, icon: '📊' },
  { id: 4, name: 'Grafik Jarak-Waktu', desc: 'Baca grafik', time: 35, count: 6, pass: 4, mult: 4, icon: '📈' },
  { id: 5, name: 'Grand Prix', desc: 'Campuran semua', time: 30, count: 8, pass: 5, mult: 5, icon: '🏆' }
];

function genFor(levelId) {
  if (levelId === 1) return qKecepatan;
  if (levelId === 2) return qDebit;
  if (levelId === 3) return qTabel;
  if (levelId === 4) return qGrafik;
  return function () { return pick([qKecepatan, qDebit, qTabel, qGrafik])(); };
}

function genQuestions(levelId) {
  var lv = LEVELS[levelId - 1];
  if (!lv) throw new Error('Level tidak dikenal: ' + levelId);
  return collect(lv.count, [genFor(levelId)]);
}

/* ---------------- verifikasi (untuk pengujian) ---------------- */

var VERIFY = {
  num: function (q) {
    return parseNum(q.choices[q.answer]) === q.meta.ans;
  },
  str: function (q) {
    return q.choices[q.answer] === q.meta.ans;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LEVELS: LEVELS,
    genQuestions: genQuestions,
    VERIFY: VERIFY,
    rand: rand, pick: pick, shuffle: shuffle,
    fmt: fmt, parseNum: parseNum,
    makeQ: makeQ, qKecepatan: qKecepatan, qDebit: qDebit,
    qTabel: qTabel, qGrafik: qGrafik, svgGrafik: svgGrafik
  };
}
