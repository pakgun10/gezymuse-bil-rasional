/* =====================================================================
 * Kartu Persamaan — generator puzzle
 * Setiap puzzle: susun kartu angka/operator ke slot hingga persamaan benar.
 * Soal DIBANGKITKAN dari solusi yang valid -> selalu ada jawaban benar,
 * dan SEMUA susunan yang hasilnya tepat ikut dinilai benar.
 * Dependensi: fractions.js
 * ===================================================================== */
'use strict';

function _dep(name) {
  if (typeof globalThis[name] !== 'undefined') return globalThis[name];
  if (typeof require !== 'undefined') return require('./fractions.js')[name];
  throw new Error('dependensi hilang: ' + name);
}
var F = _dep('F');
var fadd = _dep('fadd');
var fsub = _dep('fsub');
var fmul = _dep('fmul');
var fdiv = _dep('fdiv');
var feq = _dep('feq');
var flabel = _dep('flabel');
var opPretty = _dep('opPretty');
var evalTokens = _dep('evalTokens');

/* ---------------- util ---------------- */
function ri(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function pickA(a) { return a[Math.floor(Math.random() * a.length)]; }
function shuffleA(a) {
  var x = a.slice();
  for (var i = x.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = x[i]; x[i] = x[j]; x[j] = t;
  }
  return x;
}
function maybeNeg(v, p) { return (v !== 0 && Math.random() < p) ? -v : v; }

/* ---------------- kartu ---------------- */
var _cid = 0;
function _nextCid() { return 'c' + (++_cid); }

function numCard(n) {
  var fr = F(n);
  return { cid: _nextCid(), kind: 'num', f: fr, op: null, label: flabel(fr) };
}
function fracCard(fr) {
  return { cid: _nextCid(), kind: 'num', f: fr, op: null, label: flabel(fr) };
}
function opCard(op) {
  return { cid: _nextCid(), kind: 'op', f: null, op: op, label: opPretty(op) };
}

/* ---------------- evaluasi ----------------
 * p: puzzle, placed: array sejajar slotKinds berisi kartu / null.
 * Mengembalikan: F (hasil), null (pembagian nol), undefined (belum lengkap). */
function evalPuzzle(p, placed) {
  for (var i = 0; i < p.slotKinds.length; i++) {
    if (!placed[i] || placed[i].kind !== p.slotKinds[i]) return undefined;
  }
  if (p.shape === 'paren') {
    var inner = evalTokens([placed[0].f, placed[1].f], [p.fixedOps[0]]);
    if (inner === null) return null;
    return evalTokens([inner, placed[2].f], [p.fixedOps[1]]);
  }
  var vals = [], ops = [], fi = 0;
  for (var k = 0; k < p.slotKinds.length; k++) {
    if (p.slotKinds[k] === 'num') {
      vals.push(placed[k].f);
      if (fi < p.fixedOps.length) { ops.push(p.fixedOps[fi]); fi++; }
    } else {
      ops.push(placed[k].op);
    }
  }
  return evalTokens(vals, ops);
}

/* ---------------- LEVEL 1: Jumlah & Kurang ---------------- */

function gAdd2() {
  var a = ri(1, 15), b = ri(1, 15);
  var sol = [numCard(a), numCard(b)];
  return {
    shape: 'flat', fixedOps: ['+'], slotKinds: ['num', 'num'],
    cards: shuffleA(sol.concat([numCard(ri(1, 20))])),
    solution: sol, targetF: F(a + b),
    explain: 'Salah satu cara: ' + a + ' + ' + b + ' = ' + (a + b) + '.'
  };
}

function gSub2() {
  var a = ri(6, 20), b = ri(1, a - 1);
  var sol = [numCard(a), numCard(b)];
  return {
    shape: 'flat', fixedOps: ['-'], slotKinds: ['num', 'num'],
    cards: shuffleA(sol.concat([numCard(ri(1, 20))])),
    solution: sol, targetF: F(a - b),
    explain: 'Salah satu cara: ' + a + ' \u2212 ' + b + ' = ' + (a - b) + '.'
  };
}

function gAdd3() {
  var a = ri(1, 10), b = ri(1, 10), c = ri(1, 10);
  var sol = [numCard(a), numCard(b), numCard(c)];
  return {
    shape: 'flat', fixedOps: ['+', '+'], slotKinds: ['num', 'num', 'num'],
    cards: shuffleA(sol.concat([numCard(ri(1, 15)), numCard(ri(1, 15))])),
    solution: sol, targetF: F(a + b + c),
    explain: 'Salah satu cara: ' + a + ' + ' + b + ' + ' + c + ' = ' + (a + b + c) + '.'
  };
}

/* ---------------- LEVEL 2: Kali & Bagi ---------------- */

function gMul2() {
  var a = maybeNeg(ri(2, 9), 0.3), b = maybeNeg(ri(2, 9), 0.3);
  var sol = [numCard(a), numCard(b)];
  return {
    shape: 'flat', fixedOps: ['*'], slotKinds: ['num', 'num'],
    cards: shuffleA(sol.concat([numCard(maybeNeg(ri(2, 9), 0.2))])),
    solution: sol, targetF: F(a * b),
    explain: 'Salah satu cara: ' + flabel(F(a)) + ' \u00D7 ' + flabel(F(b)) +
             ' = ' + flabel(F(a * b)) + '.'
  };
}

function gDiv2() {
  var b = maybeNeg(ri(2, 9), 0.3), q = maybeNeg(ri(2, 12), 0.3);
  var a = b * q;
  var sol = [numCard(a), numCard(b)];
  return {
    shape: 'flat', fixedOps: ['/'], slotKinds: ['num', 'num'],
    cards: shuffleA(sol.concat([numCard(ri(2, 12))])),
    solution: sol, targetF: F(q),
    explain: 'Salah satu cara: ' + flabel(F(a)) + ' \u00F7 ' + flabel(F(b)) +
             ' = ' + flabel(F(q)) + '.'
  };
}

function gMulDiv() {
  var a, b, c, tries = 0;
  do {
    a = maybeNeg(ri(2, 9), 0.25); b = ri(2, 9); c = ri(2, 9);
    tries++;
  } while ((a * b) % c !== 0 && tries < 300);
  var sol = [numCard(a), numCard(b), numCard(c)];
  var targetF = fdiv(fmul(F(a), F(b)), F(c));
  return {
    shape: 'flat', fixedOps: ['*', '/'], slotKinds: ['num', 'num', 'num'],
    cards: shuffleA(sol.concat([numCard(ri(2, 9))])),
    solution: sol, targetF: targetF,
    explain: 'Salah satu cara: ' + flabel(F(a)) + ' \u00D7 ' + flabel(F(b)) +
             ' \u00F7 ' + flabel(F(c)) + ' = ' + flabel(targetF) +
             '. (Kerjakan \u00D7 dan \u00F7 dari kiri ke kanan.)'
  };
}

/* ---------------- LEVEL 3: Operasi Campuran ---------------- */

function gAddMul() {
  var a = maybeNeg(ri(1, 15), 0.25), b = ri(2, 9), c = maybeNeg(ri(2, 9), 0.25);
  var sol = [numCard(a), numCard(b), numCard(c)];
  var targetF = F(a + b * c);
  return {
    shape: 'flat', fixedOps: ['+', '*'], slotKinds: ['num', 'num', 'num'],
    cards: shuffleA(sol.concat([numCard(ri(1, 12))])),
    solution: sol, targetF: targetF,
    explain: 'Salah satu cara: ' + flabel(F(a)) + ' + ' + flabel(F(b)) + ' \u00D7 ' +
             flabel(F(c)) + ' = ' + flabel(targetF) +
             '. (Perkalian dikerjakan dulu!)'
  };
}

function gParen() {
  var a = ri(1, 9), b = ri(1, 9), c = maybeNeg(ri(2, 9), 0.25);
  var sol = [numCard(a), numCard(b), numCard(c)];
  var targetF = F((a + b) * c);
  return {
    shape: 'paren', fixedOps: ['+', '*'], slotKinds: ['num', 'num', 'num'],
    cards: shuffleA(sol.concat([numCard(ri(1, 9))])),
    solution: sol, targetF: targetF,
    explain: 'Salah satu cara: (' + a + ' + ' + b + ') \u00D7 ' + flabel(F(c)) +
             ' = ' + flabel(targetF) + '. (Kurung dikerjakan dulu!)'
  };
}

function gMulAdd() {
  var a = ri(2, 9), b = ri(2, 9), c = maybeNeg(ri(1, 12), 0.25);
  var sol = [numCard(a), numCard(b), numCard(c)];
  var targetF = F(a * b + c);
  return {
    shape: 'flat', fixedOps: ['*', '+'], slotKinds: ['num', 'num', 'num'],
    cards: shuffleA(sol.concat([numCard(ri(1, 12))])),
    solution: sol, targetF: targetF,
    explain: 'Salah satu cara: ' + a + ' \u00D7 ' + b + ' + ' + flabel(F(c)) +
             ' = ' + flabel(targetF) + '.'
  };
}

function gSubDiv() {
  var c = ri(2, 9), k = ri(2, 9), b = c * k, a = maybeNeg(ri(2, 20), 0.2);
  var sol = [numCard(a), numCard(b), numCard(c)];
  var targetF = F(a - k);
  return {
    shape: 'flat', fixedOps: ['-', '/'], slotKinds: ['num', 'num', 'num'],
    cards: shuffleA(sol.concat([numCard(ri(2, 12))])),
    solution: sol, targetF: targetF,
    explain: 'Salah satu cara: ' + flabel(F(a)) + ' \u2212 ' + b + ' \u00F7 ' + c +
             ' = ' + flabel(targetF) + '. (Pembagian dikerjakan dulu!)'
  };
}

/* ---------------- LEVEL 4: Pecahan ---------------- */

var PD = [2, 3, 4, 6, 8];

function gFAdd() {
  var d = pickA(PD), n1 = ri(1, d - 1), n2 = ri(1, d - 1);
  var f1 = F(n1, d), f2 = F(n2, d);
  var sol = [fracCard(f1), fracCard(f2)];
  var targetF = fadd(f1, f2);
  return {
    shape: 'flat', fixedOps: ['+'], slotKinds: ['num', 'num'],
    cards: shuffleA(sol.concat([fracCard(F(ri(1, d - 1), d))])),
    solution: sol, targetF: targetF,
    explain: 'Salah satu cara: ' + flabel(f1) + ' + ' + flabel(f2) +
             ' = ' + flabel(targetF) + '.'
  };
}

function gFAddDiff() {
  var d1 = pickA([2, 3, 4]);
  var d2 = pickA(PD.filter(function (d) { return d !== d1; }));
  var f1 = F(ri(1, d1 - 1), d1), f2 = F(ri(1, d2 - 1), d2);
  var sol = [fracCard(f1), fracCard(f2)];
  var targetF = fadd(f1, f2);
  return {
    shape: 'flat', fixedOps: ['+'], slotKinds: ['num', 'num'],
    cards: shuffleA(sol.concat([fracCard(F(ri(1, d1 - 1), d1))])),
    solution: sol, targetF: targetF,
    explain: 'Salah satu cara: ' + flabel(f1) + ' + ' + flabel(f2) +
             ' = ' + flabel(targetF) + '. (Samakan penyebut dulu!)'
  };
}

function gFSub() {
  var d = pickA(PD), n1 = ri(2, d), n2 = ri(1, n1 - 1);
  var f1 = F(n1, d), f2 = F(n2, d);
  var sol = [fracCard(f1), fracCard(f2)];
  var targetF = fsub(f1, f2);
  return {
    shape: 'flat', fixedOps: ['-'], slotKinds: ['num', 'num'],
    cards: shuffleA(sol.concat([fracCard(F(ri(1, d - 1), d))])),
    solution: sol, targetF: targetF,
    explain: 'Salah satu cara: ' + flabel(f1) + ' \u2212 ' + flabel(f2) +
             ' = ' + flabel(targetF) + '.'
  };
}

function gFMul() {
  var f1 = F(ri(1, 3), pickA([2, 3, 4])), f2 = F(ri(1, 3), pickA([2, 3, 4]));
  var sol = [fracCard(f1), fracCard(f2)];
  var targetF = fmul(f1, f2);
  return {
    shape: 'flat', fixedOps: ['*'], slotKinds: ['num', 'num'],
    cards: shuffleA(sol.concat([fracCard(F(ri(1, 3), pickA([2, 3, 4])))])),
    solution: sol, targetF: targetF,
    explain: 'Salah satu cara: ' + flabel(f1) + ' \u00D7 ' + flabel(f2) +
             ' = ' + flabel(targetF) + '. (Pembilang × pembilang, penyebut × penyebut.)'
  };
}

function gFAdd3() {
  var d = pickA([4, 6, 8]);
  var fs = [F(ri(1, d - 1), d), F(ri(1, d - 1), d), F(ri(1, d - 1), d)];
  var sol = fs.map(fracCard);
  var targetF = fadd(fadd(fs[0], fs[1]), fs[2]);
  return {
    shape: 'flat', fixedOps: ['+', '+'], slotKinds: ['num', 'num', 'num'],
    cards: shuffleA(sol.concat([fracCard(F(ri(1, d - 1), d)), fracCard(F(ri(1, d - 1), d))])),
    solution: sol, targetF: targetF,
    explain: 'Salah satu cara: ' + fs.map(flabel).join(' + ') + ' = ' + flabel(targetF) + '.'
  };
}

/* ---------------- LEVEL 5: Bos Operator ---------------- */

function gOp2() {
  var a, b, op = pickA(['+', '-', '*', '/']), t;
  if (op === '/') {
    b = ri(2, 9);
    var q = ri(2, 12);
    a = b * q; t = F(q);
  } else {
    a = maybeNeg(ri(2, 15), 0.25); b = maybeNeg(ri(2, 15), 0.25);
    t = op === '+' ? F(a + b) : op === '-' ? F(a - b) : F(a * b);
  }
  var ca = numCard(a), cb = numCard(b), co = opCard(op);
  var sol = [ca, co, cb];
  var otherOps = shuffleA(['+', '-', '*', '/'].filter(function (o) { return o !== op; }))
    .slice(0, 2).map(opCard);
  var cards = shuffleA([ca, cb, numCard(ri(1, 15))].concat([co].concat(otherOps)));
  return {
    shape: 'flat', fixedOps: [], slotKinds: ['num', 'op', 'num'],
    cards: cards, solution: sol, targetF: t,
    explain: 'Salah satu cara: ' + flabel(F(a)) + ' ' + opPretty(op) + ' ' +
             flabel(F(b)) + ' = ' + flabel(t) + '.'
  };
}

function gOp3() {
  var a = ri(1, 12), b = ri(1, 12), c = ri(1, 12);
  var op1 = pickA(['+', '-', '*']), op2 = pickA(['+', '-', '*']);
  var t = evalTokens([F(a), F(b), F(c)], [op1, op2]);
  var ca = numCard(a), cb = numCard(b), cc = numCard(c);
  var co1 = opCard(op1), co2 = opCard(op2);
  var sol = [ca, co1, cb, co2, cc];
  var cards = shuffleA([ca, cb, cc, numCard(ri(1, 12)), co1, co2, opCard(pickA(['+', '-', '*']))]);
  return {
    shape: 'flat', fixedOps: [], slotKinds: ['num', 'op', 'num', 'op', 'num'],
    cards: cards, solution: sol, targetF: t,
    explain: 'Salah satu cara: ' + a + ' ' + opPretty(op1) + ' ' + b + ' ' +
             opPretty(op2) + ' ' + c + ' = ' + flabel(t) +
             '. (Ingat urutan operasi!)'
  };
}

/* ---------------- koleksi level ---------------- */

function _pkey(p) {
  return p.shape + '|' + p.slotKinds.join(',') + '|' + p.fixedOps.join('') + '|' +
         flabel(p.targetF) + '|' + p.cards.map(function (c) { return c.label; })
         .sort().join(',');
}

function collectP(n, gens) {
  var out = [], seen = {}, guard = 0;
  while (out.length < n && guard++ < n * 80) {
    var p = pickA(gens)();
    var k = _pkey(p);
    if (!seen[k]) { seen[k] = true; out.push(p); }
  }
  return out;
}

function genL1(n) { return collectP(n, [gAdd2, gAdd2, gSub2, gAdd3]); }
function genL2(n) { return collectP(n, [gMul2, gMul2, gDiv2, gMulDiv]); }
function genL3(n) { return collectP(n, [gAddMul, gParen, gMulAdd, gSubDiv]); }
function genL4(n) { return collectP(n, [gFAdd, gFAddDiff, gFSub, gFMul, gFAdd3]); }
function genL5(n) { return collectP(n, [gOp2, gOp2, gOp3, gOp3]); }

var LEVELS = [
  { id: 1, name: 'Jumlah & Kurang', desc: 'Bilangan bulat: penjumlahan & pengurangan',
    time: 60, count: 6, pass: 4, mult: 1, icon: '\u2795', gen: genL1 },
  { id: 2, name: 'Kali & Bagi', desc: 'Bilangan bulat: perkalian, pembagian & bilangan negatif',
    time: 60, count: 6, pass: 4, mult: 2, icon: '\u2716\uFE0F', gen: genL2 },
  { id: 3, name: 'Operasi Campuran', desc: 'Urutan operasi & tanda kurung',
    time: 75, count: 6, pass: 4, mult: 3, icon: '\uD83E\uDDEE', gen: genL3 },
  { id: 4, name: 'Pecahan', desc: 'Penjumlahan, pengurangan & perkalian pecahan',
    time: 75, count: 6, pass: 4, mult: 4, icon: '\uD83C\uDF70', gen: genL4 },
  { id: 5, name: 'Bos Operator', desc: 'Susun bilangan DAN operatornya!',
    time: 90, count: 8, pass: 5, mult: 5, icon: '\uD83D\uDC51', gen: genL5 }
];

function genPuzzle(levelId) {
  var lv = LEVELS[levelId - 1];
  if (!lv) throw new Error('Level tidak dikenal: ' + levelId);
  return lv.gen(lv.count);
}

/* ---------------- verifikasi (untuk pengujian) ---------------- */
function verifyPuzzle(p) {
  var r = evalPuzzle(p, p.solution);
  if (r === undefined || r === null) return false;
  if (!feq(r, p.targetF)) return false;
  var ids = {};
  p.cards.forEach(function (c) { ids[c.cid] = true; });
  for (var i = 0; i < p.solution.length; i++) {
    if (!ids[p.solution[i].cid]) return false;
    if (p.solution[i].kind !== p.slotKinds[i]) return false;
  }
  return true;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LEVELS: LEVELS, genPuzzle: genPuzzle, evalPuzzle: evalPuzzle,
    verifyPuzzle: verifyPuzzle,
    F: F, feq: feq, flabel: flabel, opPretty: opPretty, evalTokens: evalTokens,
    fadd: fadd, fsub: fsub, fmul: fmul, fdiv: fdiv,
    _cards: { numCard: numCard, fracCard: fracCard, opCard: opCard }
  };
}
