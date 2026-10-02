/* =====================================================================
 * Ubah Bentuk — bank soal & generator
 * Game Matematika SMP • Materi: Bilangan Rasional
 *   (pecahan <-> desimal <-> persen, termasuk pecahan campuran)
 * Murni JavaScript, tanpa dependensi. Bisa diuji dengan Node.
 * Semua nilai disimpan sebagai pecahan eksak [n, d] — tanpa float.
 * ===================================================================== */
'use strict';

/* ---------------- util (pola Rasio Rush) ---------------- */

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

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { var t = a % b; a = b; b = t; }
  return a || 1;
}

/* ---------------- pecahan eksak & tiga bentuk tampilan ---------------- */

function red(n, d) {
  var g = gcd(n, d);
  return [n / g, d / g];
}

/* Desimal eksak gaya Indonesia: decStr(3,4) -> "0,75".
 * Hanya dipanggil untuk penyebut yang menghasilkan desimal berhenti. */
function decStr(n, d) {
  n = Math.abs(n); d = Math.abs(d);
  var ip = Math.floor(n / d), rem = n % d, s = String(ip), guard = 0;
  if (rem !== 0) {
    s += ',';
    while (rem !== 0 && guard++ < 12) {
      rem *= 10;
      s += Math.floor(rem / d);
      rem %= d;
    }
  }
  return s;
}

function pctStr(n, d) {
  var r = red(100 * n, d);
  return decStr(r[0], r[1]) + '%';
}

function fracStr(n, d) {
  var r = red(n, d);
  return r[1] === 1 ? String(r[0]) : r[0] + '/' + r[1];
}

function mixedStr(w, n, d) {
  var r = red(n, d);
  return r[1] === 1 ? String(w + r[0]) : w + ' ' + r[0] + '/' + r[1];
}

/* Tampilkan nilai (W + n/d) dalam bentuk form: 'frac' | 'dec' | 'pct'. */
function dispVal(W, n, d, form) {
  var N = W * d + n;
  if (form === 'frac') return W > 0 ? mixedStr(W, n, d) : fracStr(n, d);
  if (form === 'dec') return decStr(N, d);
  return pctStr(N, d);
}

/* Parse kembali tampilan menjadi pecahan [n, d] — untuk verifikasi. */
function parseNum(s) {
  var pct = false;
  s = String(s).trim();
  if (s.charAt(s.length - 1) === '%') { pct = true; s = s.slice(0, -1); }
  var n, d;
  if (s.indexOf('/') !== -1) {
    var parts = s.split(' ');
    if (parts.length === 2) {
      var w = parseInt(parts[0], 10);
      var fd = parts[1].split('/');
      n = w * parseInt(fd[1], 10) + parseInt(fd[0], 10);
      d = parseInt(fd[1], 10);
    } else {
      var fd2 = s.split('/');
      n = parseInt(fd2[0], 10);
      d = parseInt(fd2[1], 10);
    }
  } else if (s.indexOf(',') !== -1) {
    var c = s.split(',');
    var k = c[1].length, p = Math.pow(10, k);
    n = parseInt(c[0], 10) * p + parseInt(c[1], 10);
    d = p;
  } else {
    n = parseInt(s, 10);
    d = 1;
  }
  if (pct) d = d * 100;
  return red(n, d);
}

/* ---------------- pembangun soal (pola Rasio Rush) ---------------- */

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
  while (ds.length < 3 && guard++ < 60) {
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
  while (qs.length < n && guard++ < n * 60) {
    var q = pick(gens)();
    if (!seen[q.prompt]) { seen[q.prompt] = true; qs.push(q); }
  }
  return qs;
}

/* ---------------- generator konversi ---------------- */

var FORM_NAME = { frac: 'pecahan', dec: 'desimal', pct: 'persen' };

function randFrac(denoms) {
  var d = pick(denoms);
  var n = rand(1, d - 1);
  return red(n, d);
}

/* Geser koma satu posisi ke kiri: "75" -> "7,5", "12,5" -> "1,25". */
function shiftLeftComma(s) {
  var i = s.indexOf(',');
  if (i === -1) {
    return s.length > 1 ? s.slice(0, -1) + ',' + s.slice(-1) : '0,' + s;
  }
  var parts = s.split(',');
  var ip = parts[0], fp = parts[1];
  if (ip.length > 1) return ip.slice(0, -1) + ',' + ip.slice(-1) + fp;
  return '0,' + ip + fp;
}

/* Pengecoh klasik sesuai bentuk target. */
function trapDistractors(W, n, d, to) {
  var traps = [];
  var N = W * d + n;
  var rc = red(n, d);
  if (to === 'dec') {
    var ds = decStr(N, d);
    var cpos = ds.indexOf(',');
    if (cpos !== -1) {
      var fp = ds.slice(cpos + 1);
      /* tukar dua digit desimal pertama: 0,75 -> 0,57 */
      if (fp.length >= 2 && fp[0] !== fp[1]) {
        traps.push(ds.slice(0, cpos + 1) + fp[1] + fp[0] + fp.slice(2));
      }
      /* lupa membagi: 0,75 -> 75 */
      var noComma = ds.replace(',', '').replace(/^0+/, '');
      if (noComma !== '') traps.push(noComma);
      /* komplemen: 0,75 -> 0,25 */
      if (d - rc[0] !== rc[0]) traps.push(decStr(W * d + (d - rc[0]), d));
    }
  } else if (to === 'pct') {
    /* lupa ×100: 75% -> 0,75% */
    traps.push(decStr(N, d) + '%');
    /* salah 10×: 75% -> 7,5% */
    traps.push(shiftLeftComma(pctStr(N, d).slice(0, -1)) + '%');
    if (d - rc[0] !== rc[0]) traps.push(pctStr(W * d + (d - rc[0]), d));
  } else {
    /* to === 'frac' */
    if (rc[0] > 1) traps.push(dispVal(W, rc[0] - 1, rc[1], 'frac'));
    traps.push(dispVal(W, rc[0] + 1, rc[1], 'frac'));
    if (d - rc[0] !== rc[0]) traps.push(dispVal(W, d - rc[0], d, 'frac'));
    if (W > 0) traps.push(dispVal(W + 1, rc[0], rc[1], 'frac'));
  }
  return traps;
}

/* Pengecoh dari nilai "tetangga" yang valid. */
function siblingDistractors(W, n, d, to, denoms, count) {
  var out = [], guard = 0;
  while (out.length < count && guard++ < 60) {
    var f = randFrac(denoms);
    if (f[0] * d === f[1] * n) continue; /* nilai sama, lewati */
    var W2 = W > 0 ? rand(1, 4) : 0;
    var s = dispVal(W2, f[0], f[1], to);
    if (out.indexOf(s) === -1) out.push(s);
  }
  return out;
}

function explainConv(W, n, d, from, to) {
  var src = dispVal(W, n, d, from);
  var tgt = dispVal(W, n, d, to);
  var N = W * d + n;
  var b = function (s) { return '<b>' + s + '</b>'; };
  if (from === 'frac' && to === 'dec') {
    if (W > 0) {
      return src + ' = ' + W + ' + (' + n + ' ÷ ' + d + ') = ' + W + ' + ' +
        decStr(n, d) + ' = ' + b(tgt) + '.';
    }
    return src + ' = ' + N + ' ÷ ' + d + ' = ' + b(tgt) + '.';
  }
  if (from === 'frac' && to === 'pct') {
    return src + ' = ' + decStr(N, d) + ' = ' + decStr(N, d) +
      ' × 100% = ' + b(tgt) + '.';
  }
  if (from === 'dec' && to === 'frac') {
    var raw = rawDecParts(n, d); /* bagian pecahan saja (tanpa bilangan bulat) */
    var g = gcd(raw[0], raw[1]);
    var simpNote = g > 1 ? ' Sederhanakan dengan FPB(' + raw[0] + ', ' + raw[1] +
      ') = ' + g + ' menjadi ' + b(tgt) + '.' : ' = ' + b(tgt) + '.';
    if (W > 0) {
      return src + ' = ' + W + ' ' + raw[0] + '/' + raw[1] + simpNote;
    }
    return src + ' = ' + raw[0] + '/' + raw[1] + simpNote;
  }
  if (from === 'dec' && to === 'pct') {
    return src + ' × 100% = ' + b(tgt) + '.';
  }
  if (from === 'pct' && to === 'dec') {
    return src + ' = ' + src.replace('%', '') + ' ÷ 100 = ' + b(tgt) + '.';
  }
  if (from === 'pct' && to === 'frac') {
    var ps = pctStr(N, d).slice(0, -1);
    var pp = parseNum(ps);
    var num = pp[0], den = pp[1] * 100;
    var g2 = gcd(num, den);
    return src + ' = ' + num + '/' + den + '. Sederhanakan dengan FPB(' + num +
      ', ' + den + ') = ' + g2 + ' menjadi ' + b(tgt) + '.';
  }
  return src + ' = ' + b(tgt) + '.';
}

/* Bagian pembilang/penyebut mentah dari desimal N/d (sebelum disederhanakan). */
function rawDecParts(N, d) {
  var ip = Math.floor(N / d), rem = N % d, digits = '', guard = 0;
  while (rem !== 0 && guard++ < 12) {
    rem *= 10;
    digits += Math.floor(rem / d);
    rem %= d;
  }
  if (digits === '') return [ip, 1];
  var p = Math.pow(10, digits.length);
  return [ip * p + parseInt(digits, 10), p];
}

function qConvert(cfg) {
  var f = randFrac(cfg.denoms);
  var mixed = cfg.mixed === 'random' ? pick([true, false]) : !!cfg.mixed;
  var W = mixed ? rand(1, 4) : 0;
  var n = f[0], d = f[1];
  var from = pick(cfg.forms);
  var others = cfg.forms.filter(function (x) { return x !== from; });
  var to = pick(others);
  var src = dispVal(W, n, d, from);
  var tgt = dispVal(W, n, d, to);
  var toName = to === 'frac'
    ? (W > 0 ? 'pecahan campuran' : 'pecahan paling sederhana')
    : FORM_NAME[to];
  var distractors = trapDistractors(W, n, d, to)
    .concat(siblingDistractors(W, n, d, to, cfg.denoms, 6));
  return makeQ(
    'Bentuk <b>' + toName + '</b> dari <b>' + src + '</b> adalah …',
    tgt,
    distractors,
    explainConv(W, n, d, from, to),
    { kind: 'conv', N: W * d + n, d: d, from: from, to: to }
  );
}

/* ---------------- konfigurasi level ---------------- */

var LEVEL_CFG = {
  1: { denoms: [2, 4, 5, 10, 20, 25, 50], forms: ['frac', 'dec'], mixed: false },
  2: { denoms: [2, 4, 5, 8, 10, 20, 25, 50], forms: ['frac', 'dec', 'pct'], mixed: false },
  3: { denoms: [2, 4, 5, 8, 10], forms: ['frac', 'dec', 'pct'], mixed: true },
  4: { denoms: [2, 4, 5, 8, 10, 20, 25, 40, 50, 125], forms: ['frac', 'dec', 'pct'], mixed: false },
  5: { denoms: [2, 4, 5, 8, 10, 20, 25, 50, 125], forms: ['frac', 'dec', 'pct'], mixed: 'random' }
};

function genLevel(n, levelId) {
  var cfg = LEVEL_CFG[levelId];
  return collect(n, [function () { return qConvert(cfg); }]);
}

var LEVELS = [
  { id: 1, name: 'Pecahan ↔ Desimal', desc: 'Mengubah pecahan ke desimal & sebaliknya',
    time: 30, count: 8,  pass: 6, mult: 1, icon: '🌱' },
  { id: 2, name: 'Tambah Persen', desc: 'Pecahan, desimal & persen tiga arah',
    time: 25, count: 8,  pass: 6, mult: 2, icon: '💯' },
  { id: 3, name: 'Pecahan Campuran', desc: 'Bilangan campuran ↔ desimal & persen',
    time: 25, count: 8,  pass: 6, mult: 3, icon: '🍰' },
  { id: 4, name: 'Dua Arah Cepat', desc: 'Semua bentuk, dua arah, penyebut bervariasi',
    time: 20, count: 8,  pass: 6, mult: 4, icon: '🔀' },
  { id: 5, name: 'Kilatan', desc: 'Campuran semua materi, waktu singkat',
    time: 15, count: 10, pass: 7, mult: 5, icon: '👑' }
];

function genQuestions(levelId) {
  var lv = LEVELS[levelId - 1];
  if (!lv) throw new Error('Level tidak dikenal: ' + levelId);
  return genLevel(lv.count, levelId);
}

/* ---------------- verifikasi (untuk pengujian) ---------------- */

var VERIFY = {
  conv: function (q) {
    var m = q.meta;
    var p = parseNum(q.choices[q.answer]);
    return p[0] * m.d === p[1] * m.N;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LEVELS: LEVELS,
    LEVEL_CFG: LEVEL_CFG,
    genQuestions: genQuestions,
    VERIFY: VERIFY,
    rand: rand, pick: pick, shuffle: shuffle, gcd: gcd,
    red: red, decStr: decStr, pctStr: pctStr, fracStr: fracStr,
    mixedStr: mixedStr, dispVal: dispVal, parseNum: parseNum,
    makeQ: makeQ
  };
}
