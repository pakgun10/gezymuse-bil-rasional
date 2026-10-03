/* Uji logika Dompet Pintar: node test-dompet-pintar.js */
'use strict';
var Q = require('./js/questions.js');

var fails = 0, total = 0;
function assert(cond, msg) {
  total++;
  if (!cond) { fails++; console.log('GAGAL: ' + msg); }
}

/* 1. parseNum */
assert(Q.parseNum('Rp150.000') === 150000, 'parse Rp150.000');
assert(Q.parseNum('Rp1.120.000') === 1120000, 'parse Rp1.120.000');
assert(Q.parseNum('25%') === 25, 'parse 25%');

/* 2. Setiap level */
Q.LEVELS.forEach(function (lv) {
  for (var i = 0; i < 300; i++) {
    var qs = Q.genQuestions(lv.id);
    assert(qs.length === lv.count, 'L' + lv.id + ': jumlah soal');
    var seen = {};
    qs.forEach(function (q) {
      assert(q.choices.length === 4, 'L' + lv.id + ': 4 opsi');
      var uniq = {};
      q.choices.forEach(function (c) { uniq[c] = true; });
      assert(Object.keys(uniq).length === 4, 'L' + lv.id + ': opsi unik [' + q.choices.join('|') + ']');
      assert(q.answer >= 0 && q.answer < 4, 'L' + lv.id + ': index valid');
      var verifier = q.meta.pct ? Q.VERIFY.pct : Q.VERIFY.money;
      assert(verifier(q), 'L' + lv.id + ': jawaban benar [' + q.prompt.replace(/<[^>]+>/g, '').slice(0, 60) + ' -> ' + q.choices[q.answer] + ']');
      assert(q.hint && q.hint.length > 10, 'L' + lv.id + ': ada trik/hint');
      assert(q.explain.indexOf(q.choices[q.answer]) !== -1, 'L' + lv.id + ': pembahasan memuat jawaban');
      assert(!seen[q.prompt], 'L' + lv.id + ': prompt unik');
      seen[q.prompt] = true;
    });
  }
});

/* 3. Semua jawaban rupiah bulat (tanpa koma) */
for (var j = 0; j < 200; j++) {
  Q.genQuestions(5).forEach(function (q) {
    if (!q.meta.pct) {
      assert(Q.parseNum(q.choices[q.answer]) % 1 === 0, 'rupiah bulat: ' + q.choices[q.answer]);
    }
  });
}

console.log('Selesai: ' + total + ' assertions, ' + fails + ' gagal.');
process.exit(fails ? 1 : 0);
