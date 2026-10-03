/* Uji logika Laju Perubahan: node test-laju-perubahan.js */
'use strict';
var Q = require('./js/questions.js');

var fails = 0, total = 0;
function assert(cond, msg) {
  total++;
  if (!cond) { fails++; console.log('GAGAL: ' + msg); }
}

/* 1. parseNum */
assert(Q.parseNum('1.200 km') === 1200, 'parse 1.200 km');
assert(Q.parseNum('60 km/jam') === 60, 'parse 60 km/jam');
assert(Q.parseNum('20 liter/menit') === 20, 'parse 20 liter/menit');

/* 2. SVG grafik valid */
var svg = Q.svgGrafik([{ pts: [[0, 0], [4, 240]], label: 'A', color: '#fff' }], 4, 240);
assert(svg.indexOf('<svg') === 0 && svg.indexOf('</svg>') !== -1, 'svg lengkap');
assert((svg.match(/<circle/g) || []).length === 2, 'svg: 2 titik');

/* 3. Setiap level */
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
      var verifier = q.meta.str ? Q.VERIFY.str : Q.VERIFY.num;
      assert(verifier(q), 'L' + lv.id + ': jawaban benar [' + q.prompt.replace(/<[^>]+>/g, '').slice(0, 50) + ' -> ' + q.choices[q.answer] + ']');
      assert(q.explain.indexOf('<b>') !== -1, 'L' + lv.id + ': pembahasan berformat');
      assert(!seen[q.prompt], 'L' + lv.id + ': prompt unik');
      seen[q.prompt] = true;
    });
  }
});

/* 4. Semua jawaban numerik bulat positif */
for (var j = 0; j < 100; j++) {
  Q.genQuestions(5).forEach(function (q) {
    if (!q.meta.str) {
      var v = Q.parseNum(q.choices[q.answer]);
      assert(v > 0 && v % 1 === 0, 'jawaban bulat positif: ' + q.choices[q.answer]);
    }
  });
}

console.log('Selesai: ' + total + ' assertions, ' + fails + ' gagal.');
process.exit(fails ? 1 : 0);
