/* Uji logika Ubah Bentuk: node test-ubah-bentuk.js */
'use strict';
var Q = require('./js/questions.js');

var fails = 0, total = 0;
function assert(cond, msg) {
  total++;
  if (!cond) { fails++; console.log('GAGAL: ' + msg); }
}

/* 1. Round-trip tampilan -> parse untuk semua bentuk */
var denoms = [2, 4, 5, 8, 10, 20, 25, 40, 50, 125];
for (var t = 0; t < 3000; t++) {
  var d = denoms[Math.floor(Math.random() * denoms.length)];
  var n = 1 + Math.floor(Math.random() * (d - 1));
  var W = Math.floor(Math.random() * 5);
  var r = Q.red(n, d);
  var D = r[1];
  var N = W * D + r[0];
  ['frac', 'dec', 'pct'].forEach(function (form) {
    var s = Q.dispVal(W, r[0], r[1], form);
    var p = Q.parseNum(s);
    assert(p[0] * D === p[1] * N,
      'round-trip ' + form + ' "' + s + '" -> [' + p + '] utk [' + N + ',' + D + ']');
  });
}

/* 2. Setiap level: struktur & kebenaran soal */
Q.LEVELS.forEach(function (lv) {
  for (var i = 0; i < 400; i++) {
    var qs = Q.genQuestions(lv.id);
    assert(qs.length === lv.count, 'L' + lv.id + ': jumlah soal ' + qs.length);
    var seen = {}; /* unik dalam satu batch soal */
    qs.forEach(function (q) {
      assert(q.choices.length === 4, 'L' + lv.id + ': 4 opsi');
      var uniq = {};
      q.choices.forEach(function (c) { uniq[c] = true; });
      assert(Object.keys(uniq).length === 4, 'L' + lv.id + ': opsi unik [' + q.choices.join('|') + ']');
      assert(q.answer >= 0 && q.answer < 4, 'L' + lv.id + ': index jawaban valid');
      assert(Q.VERIFY.conv(q), 'L' + lv.id + ': jawaban benar scr matematis [' + q.prompt.replace(/<[^>]+>/g, '') + ' -> ' + q.choices[q.answer] + ']');
      assert(q.explain.indexOf(q.choices[q.answer]) !== -1, 'L' + lv.id + ': pembahasan memuat jawaban');
      var bad = q.choices.some(function (c) { return /\?\s*$/.test(c); });
      assert(!bad, 'L' + lv.id + ': tidak ada pengecoh darurat "?"');
      assert(!seen[q.prompt], 'L' + lv.id + ': prompt unik dalam batch');
      seen[q.prompt] = true;
    });
  }
});

/* 3. Level 3 & 5 memuat pecahan campuran */
var mixedSeen = 0;
for (var j = 0; j < 200; j++) {
  Q.genQuestions(3).forEach(function (q) {
    if (/\d \d+\/\d+/.test(q.prompt)) mixedSeen++;
  });
}
assert(mixedSeen > 0, 'L3 memuat pecahan campuran');

console.log('Selesai: ' + total + ' assertions, ' + fails + ' gagal.');
process.exit(fails ? 1 : 0);
