/* =====================================================================
 * Kartu Persamaan — aritmetika pecahan EKSAK (tanpa floating point)
 * Pecahan direpresentasikan { n, d } dengan d > 0 dan sudah disederhanakan.
 * ===================================================================== */
'use strict';

function _gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { var t = a % b; a = b; b = t; }
  return a || 1;
}

/* Membuat pecahan ternormalisasi. d default 1. */
function F(n, d) {
  d = (d === undefined) ? 1 : d;
  if (!Number.isInteger(n) || !Number.isInteger(d)) {
    throw new Error('F() butuh bilangan bulat, dapat: ' + n + '/' + d);
  }
  if (d === 0) throw new Error('penyebut nol');
  if (d < 0) { n = -n; d = -d; }
  var k = _gcd(n, d);
  return { n: n / k, d: d / k };
}

function fadd(a, b) { return F(a.n * b.d + b.n * a.d, a.d * b.d); }
function fsub(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
function fmul(a, b) { return F(a.n * b.n, a.d * b.d); }
/* Pembagian: mengembalikan null bila pembagi nol (bukan throw, agar bisa
   ditangani sebagai jawaban salah, bukan crash). */
function fdiv(a, b) {
  if (b.n === 0) return null;
  return F(a.n * b.d, a.d * b.n);
}

function feq(a, b) { return a.n === b.n && a.d === b.d; }

/* Label cantik: 5, -3, 3/4, -2/5 (minus memakai − U+2212). */
function flabel(fr) {
  var s = fr.d === 1 ? String(fr.n) : fr.n + '/' + fr.d;
  return s.charAt(0) === '-' ? '\u2212' + s.slice(1) : s;
}

var OP_PRETTY = { '+': '+', '-': '\u2212', '*': '\u00D7', '/': '\u00F7' };
function opPretty(op) { return OP_PRETTY[op] || op; }

/* Evaluasi deret nilai & operator dengan urutan operasi baku
 * (× ÷ dulu kiri-ke-kanan, lalu + −).
 * vals: [F, ...], ops: ['+','-','*','/'] (ASCII internal).
 * Mengembalikan F, atau null bila terjadi pembagian dengan nol. */
function evalTokens(vals, ops) {
  var v = vals.slice(), o = ops.slice();
  var i = 0;
  while (i < o.length) {
    if (o[i] === '*' || o[i] === '/') {
      var r = (o[i] === '*') ? fmul(v[i], v[i + 1]) : fdiv(v[i], v[i + 1]);
      if (r === null) return null;
      v.splice(i, 2, r);
      o.splice(i, 1);
    } else {
      i++;
    }
  }
  var acc = v[0];
  for (var j = 0; j < o.length; j++) {
    acc = (o[j] === '+') ? fadd(acc, v[j + 1]) : fsub(acc, v[j + 1]);
  }
  return acc;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    F: F, fadd: fadd, fsub: fsub, fmul: fmul, fdiv: fdiv,
    feq: feq, flabel: flabel, opPretty: opPretty, evalTokens: evalTokens
  };
}
