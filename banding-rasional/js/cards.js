/* =====================================================================
 * Banding Rasional — generator kartu tiga bentuk
 * Kartu: { cid, n, d, label } dengan nilai eksak n/d (d > 0).
 * Bentuk: pecahan ("3/4", "2 1/2"), desimal ("0,75"), persen ("75%"),
 * termasuk varian negatif. Tanpa float — perbandingan via kali silang.
 * Bisa diuji dengan Node.
 * ===================================================================== */
'use strict';

function rand(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffle(a) {
  var x = a.slice();
  for (var i = x.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = x[i]; x[i] = x[j]; x[j] = t;
  }
  return x;
}
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { var t = a % b; a = b; b = t; }
  return a || 1;
}
function red(n, d) {
  if (d < 0) { n = -n; d = -d; }
  var g = gcd(n, d);
  return [n / g, d / g];
}

/* -1 jika A<B, 0 jika sama, 1 jika A>B. A,B = [n, d]. Eksak. */
function cmpFrac(A, B) {
  var l = A[0] * B[1], r = B[0] * A[1];
  return l < r ? -1 : l > r ? 1 : 0;
}

/* Desimal eksak gaya Indonesia (n >= 0). Hanya untuk penyebut yg
 * menghasilkan desimal berhenti. */
function decStr(n, d) {
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

var MINUS = '−';

function labelFor(v, form) {
  var neg = v[0] < 0, a = Math.abs(v[0]), d = v[1];
  var minus = neg ? MINUS : '';
  if (form === 'frac') {
    if (a >= d) {
      var w = Math.floor(a / d), r = a % d;
      return r === 0 ? minus + w : minus + w + ' ' + r + '/' + d;
    }
    return minus + a + '/' + d;
  }
  if (form === 'dec') return minus + decStr(a, d);
  return minus + pctStr(a, d);
}

var _cid = 0;
function mkCard(n, d, label) {
  return { cid: 'b' + (++_cid), n: n, d: d, label: label };
}

function randFracDenom(denoms) {
  var d = pick(denoms);
  return red(rand(1, d - 1), d);
}

function genCardWithForm(cfg, form) {
  var f = randFracDenom(cfg.denoms);
  var W = cfg.mixed ? rand(0, cfg.maxWhole) : 0;
  var N = W * f[1] + f[0];
  if (cfg.neg && Math.random() < 0.45) N = -N;
  var v = red(N, f[1]);
  return mkCard(v[0], v[1], labelFor(v, form));
}

/* ---------------- konfigurasi level ---------------- */

var LEVELS = [
  { id: 1, name: 'Pecahan Saja', desc: 'Pecahan positif 0…1', time: 60, count: 6, pass: 4, mult: 1, icon: '🌱',
    denoms: [2, 3, 4, 5, 8, 10], forms: ['frac'], mixed: false, neg: false, maxWhole: 0, cards: 6 },
  { id: 2, name: 'Tiga Bentuk', desc: 'Pecahan, desimal & persen', time: 60, count: 6, pass: 4, mult: 2, icon: '💯',
    denoms: [2, 4, 5, 8, 10, 20, 25, 50], forms: ['frac', 'dec', 'pct'], mixed: false, neg: false, maxWhole: 0, cards: 6 },
  { id: 3, name: 'Negatif Ikut', desc: 'Tiga bentuk + bilangan negatif', time: 60, count: 6, pass: 4, mult: 3, icon: '➖',
    denoms: [2, 4, 5, 8, 10, 20, 25, 50], forms: ['frac', 'dec', 'pct'], mixed: false, neg: true, maxWhole: 0, cards: 6 },
  { id: 4, name: 'Campuran', desc: 'Pecahan campuran & rentang lebar', time: 60, count: 6, pass: 4, mult: 4, icon: '🍰',
    denoms: [2, 4, 5, 8, 10], forms: ['frac', 'dec', 'pct'], mixed: true, neg: true, maxWhole: 3, cards: 6 },
  { id: 5, name: 'Bos Kilat', desc: '8 kartu campuran, waktu 45 dtk', time: 45, count: 8, pass: 5, mult: 5, icon: '👑',
    denoms: [2, 4, 5, 8, 10, 20, 25, 50, 125], forms: ['frac', 'dec', 'pct'], mixed: true, neg: true, maxWhole: 4, cards: 8 }
];

function genPuzzle(levelId) {
  var cfg = LEVELS[levelId - 1];
  if (!cfg) throw new Error('Level tidak dikenal: ' + levelId);
  var cards = [];
  function used(v) {
    for (var i = 0; i < cards.length; i++) {
      if (cmpFrac([cards[i].n, cards[i].d], v) === 0) return true;
    }
    return false;
  }
  function addCard(form) {
    var guard = 0;
    while (guard++ < 300) {
      var c = genCardWithForm(cfg, form);
      if (!used([c.n, c.d])) { cards.push(c); return; }
    }
  }
  /* minimal satu kartu per bentuk agar selalu campuran */
  cfg.forms.forEach(addCard);
  var guard2 = 0;
  while (cards.length < cfg.cards && guard2++ < 800) addCard(pick(cfg.forms));
  return { cards: shuffle(cards), count: cards.length };
}

function genLevelPuzzles(levelId) {
  var lv = LEVELS[levelId - 1];
  if (!lv) throw new Error('Level tidak dikenal: ' + levelId);
  var out = [];
  for (var i = 0; i < lv.count; i++) out.push(genPuzzle(levelId));
  return out;
}

/* ---------------- verifikasi (untuk pengujian) ---------------- */

function verifyPuzzle(p, levelId) {
  var cfg = LEVELS[levelId - 1];
  if (p.cards.length !== cfg.cards) return false;
  for (var i = 0; i < p.cards.length; i++) {
    for (var j = i + 1; j < p.cards.length; j++) {
      if (cmpFrac([p.cards[i].n, p.cards[i].d], [p.cards[j].n, p.cards[j].d]) === 0) return false;
    }
  }
  var sorted = p.cards.slice().sort(function (a, b) {
    return cmpFrac([a.n, a.d], [b.n, b.d]);
  });
  for (var k = 1; k < sorted.length; k++) {
    if (cmpFrac([sorted[k - 1].n, sorted[k - 1].d], [sorted[k].n, sorted[k].d]) >= 0) return false;
  }
  return true;
}

/* Bentuk apa saja yg muncul dalam puzzle (utk memastikan campuran). */
function formsIn(p) {
  var s = {};
  p.cards.forEach(function (c) {
    var l = c.label;
    if (l.charAt(l.length - 1) === '%') s.pct = true;
    else if (l.indexOf(',') !== -1) s.dec = true;
    else s.frac = true;
  });
  return Object.keys(s).sort().join(',');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LEVELS: LEVELS, genPuzzle: genPuzzle, genLevelPuzzles: genLevelPuzzles,
    verifyPuzzle: verifyPuzzle, formsIn: formsIn,
    cmpFrac: cmpFrac, red: red, labelFor: labelFor,
    decStr: decStr, pctStr: pctStr, rand: rand, pick: pick, shuffle: shuffle, gcd: gcd
  };
}
