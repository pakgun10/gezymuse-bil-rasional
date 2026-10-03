/* =====================================================================
 * Taksir Cepat — bank soal & generator estimasi
 * Game Matematika SMP • Materi: Menaksir & Estimasi Bilangan Rasional
 * Tipe soal: (a) taksir hasil operasi, (b) taksir persen,
 * (c) cek kewajaran. Murni JavaScript, tanpa dependensi.
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

/* Format angka gaya Indonesia: 12000 -> "12.000" (dipakai game.js) */
function fmt(n) {
  return Number(n).toLocaleString('id-ID');
}

/* Bulatkan ke 1 angka penting: 47 -> 50, 148 -> 100, 4,7 -> 5 */
function round1(n) {
  if (n === 0) return 0;
  var neg = n < 0;
  n = Math.abs(n);
  var p = Math.pow(10, Math.floor(Math.log10(n)));
  var r = Math.round(n / p) * p;
  /* hindari sisa float seperti 0,30000000000000004 */
  r = Number(r.toPrecision(12));
  return neg ? -r : r;
}

/* Format tampilan: bulat -> "1.500", desimal maks `dec` digit -> "8,3" */
function fmtNum(x, dec) {
  var r = Number(Number(x).toFixed(dec));
  if (Number.isInteger(r)) return fmt(r);
  return String(r).replace('.', ',');
}

/* Parse kembali tampilan menjadi angka (untuk verifikasi). */
function parseNum(s) {
  s = String(s).trim().replace(/\./g, '').replace(',', '.');
  return Number(s);
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

/* Pengecoh generik di sekitar taksiran est (angka).
 * Semua pengecoh masih "masuk akal" (orde sama), kecuali jebakan eksak. */
function r1(x) { return Number(Number(x).toFixed(1)); }

function estDistractors(est, exactStr) {
  var out = [];
  var cands = [est * 2, est / 2, r1(est * 1.15), r1(est * 0.85),
               est + 10, est - 10, est + 2, est - 2, est + 1, est - 1];
  var seen = {};
  cands.forEach(function (c) {
    if (c <= 0) return;
    var s1 = fmtNum(c, 1);
    if (!seen[s1] && s1 !== exactStr) { seen[s1] = true; out.push(s1); }
  });
  return out;
}

/* ---------------- TIPE A: taksir hasil operasi ---------------- */

var OPS = ['+', '−', '×', '÷'];

function genOperands(op, decimal) {
  var a, b;
  if (decimal) {
    a = rand(15, 99) / 10;
    b = rand(15, 99) / 10;
    if (op === '−' && a < b) { var t = a; a = b; b = t; }
    return [a, b];
  }
  if (op === '+') { a = rand(18, 199); b = rand(18, 199); }
  else if (op === '−') { a = rand(120, 299); b = rand(18, 89); }
  else if (op === '×') { a = rand(12, 99); b = rand(12, 49); }
  else { b = rand(4, 12); var q0 = rand(6, 30); a = b * q0 + rand(-3, 3); if (a <= 4) a = b * q0; }
  return [a, b];
}

function opExact(a, b, op) {
  if (op === '+') return a + b;
  if (op === '−') return a - b;
  if (op === '×') return a * b;
  return a / b;
}

function qEstOp(decimal) {
  var guard = 0;
  while (guard++ < 60) {
    var op = decimal ? pick(['+', '−', '×']) : pick(OPS);
    var ab = genOperands(op, decimal);
    var a = ab[0], b = ab[1];
    var ra = round1(a), rb = round1(b);
    if (ra === 0 || rb === 0) continue;
    /* taksiran harus wajar: pembulatan menyimpang maks ~12% */
    if (Math.abs(ra - a) / a > 0.12 || Math.abs(rb - b) / b > 0.12) continue;
    var exact = opExact(a, b, op);
    var est = opExact(ra, rb, op);
    var dec = decimal ? 2 : (op === '÷' ? 1 : 0);
    var exactStr = fmtNum(exact, dec);
    var estStr = fmtNum(est, 1);
    if (exactStr === estStr) continue; /* taksiran harus beda dari nilai eksak */
    var fa = fmtNum(a, decimal ? 1 : 0), fb = fmtNum(b, decimal ? 1 : 0);
    var fra = fmtNum(ra, 0), frb = fmtNum(rb, 0);
    var prompt = fa + ' ' + op + ' ' + fb + ' ≈ …';
    var explain = fa + ' ≈ ' + fra + ', ' + fb + ' ≈ ' + frb +
      ', jadi ' + fra + ' ' + op + ' ' + frb + ' = <b>' + estStr + '</b>.' +
      ' (Nilai eksaknya ' + exactStr + ' — tapi yang diminta adalah <i>taksiran</i>!)';
    var distractors = [exactStr].concat(estDistractors(est, exactStr));
    return makeQ(prompt, estStr, distractors, explain,
      { kind: 'estop', est: Number(est.toFixed(1)), op: op, a: a, b: b, ra: ra, rb: rb });
  }
  /* cadangan (hampir tak pernah terjadi) */
  return makeQ('47 + 32 ≈ …', '80', ['79', '800', '8'],
    '47 ≈ 50, 32 ≈ 30, jadi 50 + 30 = <b>80</b>.',
    { kind: 'estop', est: 80, op: '+' });
}

/* ---------------- TIPE B: taksir persen ---------------- */

var PCTS = [10, 20, 25, 50, 75];

function pctExplain(pct, rbase, est) {
  var half = est / 2, quarter = est / (pct === 75 ? 3 : 4);
  if (pct === 10) return '10% dari ' + fmt(rbase) + ' = <b>' + fmt(est) + '</b>.';
  if (pct === 20) return '10% dari ' + fmt(rbase) + ' = ' + fmt(half) + ', jadi 20% = 2 × ' +
    fmt(half) + ' = <b>' + fmt(est) + '</b>.';
  if (pct === 25) return '25% = 1/4. ' + fmt(rbase) + ' ÷ 4 = <b>' + fmt(est) + '</b>.';
  if (pct === 50) return '50% = setengah. ' + fmt(rbase) + ' ÷ 2 = <b>' + fmt(est) + '</b>.';
  return '75% = 3/4. ' + fmt(rbase) + ' ÷ 4 = ' + fmt(quarter) + ', × 3 = <b>' + fmt(est) + '</b>.';
}

function qEstPct() {
  var guard = 0;
  while (guard++ < 60) {
    var pct = pick(PCTS);
    var base = rand(18, 199);
    var rbase = Math.round(base / 10) * 10;
    if (rbase === 0) continue;
    if (Math.abs(rbase - base) / base > 0.12) continue;
    var exact = pct / 100 * base;
    var est = pct / 100 * rbase;
    var exactStr = fmtNum(exact, 1);
    var estStr = fmt(est);
    if (exactStr === estStr) continue;
    var prompt = pct + '% dari ' + fmt(base) + ' ≈ …';
    var explain = fmt(base) + ' ≈ ' + fmt(rbase) + '. ' + pctExplain(pct, rbase, est) +
      ' (Nilai eksaknya ' + exactStr + ' — tapi yang diminta adalah <i>taksiran</i>!)';
    var distractors = [exactStr].concat(estDistractors(est, exactStr));
    return makeQ(prompt, estStr, distractors, explain,
      { kind: 'estpct', est: est, pct: pct, base: base, rbase: rbase });
  }
  return makeQ('20% dari 87 ≈ …', '18', ['17,4', '180', '9'],
    '87 ≈ 90. 10% dari 90 = 9, jadi 20% = 2 × 9 = <b>18</b>.',
    { kind: 'estpct', est: 18, pct: 20 });
}

/* ---------------- TIPE C: cek kewajaran ---------------- */

function qReason() {
  var op = pick(['×', '+']);
  var a, b, exact;
  if (op === '×') { a = rand(12, 99); b = rand(12, 49); exact = a * b; }
  else { a = rand(120, 899); b = rand(120, 899); exact = a + b; }
  var est = opExact(round1(a), round1(b), op);
  var wajar = Math.random() < 0.5;
  var claimed = wajar ? exact : pick([exact * 10, Math.max(1, Math.round(exact / 10))]);
  var prompt = 'Taksirlah: <b>' + fmt(a) + ' ' + op + ' ' + fmt(b) + ' = ' + fmt(claimed) +
    '</b>. Apakah hasil ini <b>wajar</b>?';
  var explain = fmt(a) + ' ≈ ' + fmt(round1(a)) + ', ' + fmt(b) + ' ≈ ' + fmt(round1(b)) +
    ', jadi taksirannya ' + fmt(round1(a)) + ' ' + op + ' ' + fmt(round1(b)) +
    ' = <b>' + fmt(est) + '</b>. Klaim ' + fmt(claimed) +
    (wajar ? ' dekat dengan taksiran → <b>Wajar</b>.'
           : ' jauh dari taksiran → <b>Tidak wajar</b>.');
  var choices = shuffle(['Wajar', 'Tidak wajar']);
  return {
    prompt: prompt,
    choices: choices,
    answer: choices.indexOf(wajar ? 'Wajar' : 'Tidak wajar'),
    explain: explain,
    meta: { kind: 'reason', wajar: wajar }
  };
}

/* ---------------- konfigurasi level ---------------- */

var LEVELS = [
  { id: 1, name: 'Taksir Operasi', desc: 'Menaksir hasil +, −, ×, ÷', time: 30, count: 8, pass: 6, mult: 1, icon: '🌱' },
  { id: 2, name: 'Desimal', desc: 'Menaksir operasi desimal', time: 25, count: 8, pass: 6, mult: 2, icon: '🔢' },
  { id: 3, name: 'Persen Cepat', desc: 'Menaksir persen dari bilangan', time: 25, count: 8, pass: 6, mult: 3, icon: '💯' },
  { id: 4, name: 'Cek Kewajaran', desc: 'Wajar atau tidak?', time: 20, count: 8, pass: 6, mult: 4, icon: '🧐' },
  { id: 5, name: 'Kilatan', desc: 'Campuran semua, waktu singkat', time: 15, count: 10, pass: 7, mult: 5, icon: '👑' }
];

function genFor(levelId) {
  if (levelId === 1) return function () { return qEstOp(false); };
  if (levelId === 2) return function () { return qEstOp(true); };
  if (levelId === 3) return qEstPct;
  if (levelId === 4) return qReason;
  return function () { return pick([function () { return qEstOp(false); }, function () { return qEstOp(true); }, qEstPct, qReason])(); };
}

function genQuestions(levelId) {
  var lv = LEVELS[levelId - 1];
  if (!lv) throw new Error('Level tidak dikenal: ' + levelId);
  return collect(lv.count, [genFor(levelId)]);
}

/* ---------------- verifikasi (untuk pengujian) ---------------- */

var VERIFY = {
  estop: function (q) {
    return Math.abs(parseNum(q.choices[q.answer]) - q.meta.est) < 1e-9;
  },
  estpct: function (q) {
    return Math.abs(parseNum(q.choices[q.answer]) - q.meta.est) < 1e-9;
  },
  reason: function (q) {
    var picked = q.choices[q.answer];
    return (picked === 'Wajar') === q.meta.wajar;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LEVELS: LEVELS,
    genQuestions: genQuestions,
    VERIFY: VERIFY,
    rand: rand, pick: pick, shuffle: shuffle,
    fmt: fmt, fmtNum: fmtNum, parseNum: parseNum, round1: round1,
    makeQ: makeQ, qEstOp: qEstOp, qEstPct: qEstPct, qReason: qReason
  };
}
