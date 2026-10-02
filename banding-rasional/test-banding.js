/* Uji logika Banding Rasional: node test-banding.js */
'use strict';
var C = require('./js/cards.js');

var fails = 0, total = 0;
function assert(cond, msg) {
  total++;
  if (!cond) { fails++; console.log('GAGAL: ' + msg); }
}

/* Parse label kembali menjadi pecahan (hanya untuk pengujian). */
function parseLabel(l) {
  var s = String(l).replace(/−/g, '-').trim();
  var pct = false;
  if (s.charAt(s.length - 1) === '%') { pct = true; s = s.slice(0, -1); }
  var neg = false;
  if (s.charAt(0) === '-') { neg = true; s = s.slice(1); }
  var n, d;
  if (s.indexOf(' ') !== -1) {
    var p = s.split(' '), w = parseInt(p[0], 10), f = p[1].split('/');
    n = w * parseInt(f[1], 10) + parseInt(f[0], 10); d = parseInt(f[1], 10);
  } else if (s.indexOf('/') !== -1) {
    var f2 = s.split('/'); n = parseInt(f2[0], 10); d = parseInt(f2[1], 10);
  } else if (s.indexOf(',') !== -1) {
    var c = s.split(','), k = c[1].length, pw = Math.pow(10, k);
    n = parseInt(c[0], 10) * pw + parseInt(c[1], 10); d = pw;
  } else { n = parseInt(s, 10); d = 1; }
  if (pct) d *= 100;
  if (neg) n = -n;
  var g = C.gcd(n, d);
  return [n / g, d / g];
}

/* 1. cmpFrac konsisten dengan perbandingan float untuk pecahan acak */
for (var t = 0; t < 5000; t++) {
  var a = [C.rand(-50, 50), C.rand(1, 40)];
  var b = [C.rand(-50, 50), C.rand(1, 40)];
  var f = a[0] / a[1] - b[0] / b[1];
  var exp = f < -1e-12 ? -1 : f > 1e-12 ? 1 : 0;
  assert(C.cmpFrac(a, b) === exp, 'cmpFrac [' + a + '] vs [' + b + ']');
}

/* 2. Setiap level: puzzle valid, label cocok dengan nilai, bentuk campuran */
C.LEVELS.forEach(function (lv) {
  var negSeen = 0, mixedSeen = 0;
  for (var i = 0; i < 300; i++) {
    var puzzles = C.genLevelPuzzles(lv.id);
    assert(puzzles.length === lv.count, 'L' + lv.id + ': ' + lv.count + ' puzzle');
    puzzles.forEach(function (p) {
      assert(C.verifyPuzzle(p, lv.id), 'L' + lv.id + ': puzzle valid');
      /* label -> nilai harus sama dengan n/d kartu */
      p.cards.forEach(function (card) {
        var pl = parseLabel(card.label);
        assert(C.cmpFrac(pl, [card.n, card.d]) === 0,
          'L' + lv.id + ': label "' + card.label + '" = [' + card.n + ',' + card.d + ']');
      });
      /* label unik */
      var ls = {};
      p.cards.forEach(function (c) { ls[c.label] = true; });
      assert(Object.keys(ls).length === p.cards.length, 'L' + lv.id + ': label unik');
      /* cakupan bentuk */
      var forms = C.formsIn(p).split(',');
      if (lv.id === 1) {
        assert(forms.join(',') === 'frac', 'L1 hanya pecahan');
      } else {
        assert(forms.length >= 2, 'L' + lv.id + ': minimal 2 bentuk (' + forms.join('+') + ')');
      }
      if (p.cards.some(function (c) { return c.n < 0; })) negSeen++;
      if (p.cards.some(function (c) { return / /.test(c.label); })) mixedSeen++;
    });
  }
  if (lv.neg) assert(negSeen > 0, 'L' + lv.id + ': kartu negatif muncul');
  if (!lv.neg) assert(negSeen === 0, 'L' + lv.id + ': tanpa negatif');
  if (lv.mixed) assert(mixedSeen > 0, 'L' + lv.id + ': pecahan campuran muncul');
});

/* 3. Urutan benar selalu menaik tegas (simulasi cek game) */
for (var j = 0; j < 500; j++) {
  var p2 = C.genPuzzle(1 + Math.floor(Math.random() * 5));
  var srt = p2.cards.slice().sort(function (a, b) {
    return C.cmpFrac([a.n, a.d], [b.n, b.d]);
  });
  var ok = true;
  for (var k = 1; k < srt.length; k++) {
    if (C.cmpFrac([srt[k - 1].n, srt[k - 1].d], [srt[k].n, srt[k].d]) >= 0) ok = false;
  }
  assert(ok, 'urutan menaik tegas');
}

console.log('Selesai: ' + total + ' assertions, ' + fails + ' gagal.');
process.exit(fails ? 1 : 0);
