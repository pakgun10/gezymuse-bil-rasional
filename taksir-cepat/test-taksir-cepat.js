/* Uji logika Taksir Cepat: node test-taksir-cepat.js */
'use strict';
var Q = require('./js/questions.js');

var fails = 0, total = 0;
function assert(cond, msg) {
  total++;
  if (!cond) { fails++; console.log('GAGAL: ' + msg); }
}

/* 1. round1 */
[['47', 50], ['32', 30], ['148', 100], ['96', 100], ['4,7', 5], ['0,75', 0.8], ['100', 100], ['1000', 1000]].forEach(function (t) {
  assert(Q.round1(Q.parseNum(t[0])) === t[1], 'round1(' + t[0] + ')=' + t[1]);
});

/* 2. fmtNum/parseNum round-trip */
[1500, 80, 7.5, 0.8, 17.4, 1504, 100].forEach(function (n) {
  assert(Math.abs(Q.parseNum(Q.fmtNum(n, 2)) - n) < 1e-9, 'fmt round-trip ' + n);
});

/* 3. Setiap level */
Q.LEVELS.forEach(function (lv) {
  for (var i = 0; i < 300; i++) {
    var qs = Q.genQuestions(lv.id);
    assert(qs.length === lv.count, 'L' + lv.id + ': jumlah soal');
    var seen = {};
    qs.forEach(function (q) {
      var nChoices = q.meta.kind === 'reason' ? 2 : 4;
      assert(q.choices.length === nChoices, 'L' + lv.id + ': ' + nChoices + ' opsi');
      var uniq = {};
      q.choices.forEach(function (c) { uniq[c] = true; });
      assert(Object.keys(uniq).length === nChoices, 'L' + lv.id + ': opsi unik [' + q.choices.join('|') + ']');
      assert(q.answer >= 0 && q.answer < nChoices, 'L' + lv.id + ': index valid');
      var v = Q.VERIFY[q.meta.kind](q);
      assert(v, 'L' + lv.id + ': jawaban benar [' + q.prompt.replace(/<[^>]+>/g, '') + ' -> ' + q.choices[q.answer] + ']');
      assert(q.explain.indexOf(String(q.choices[q.answer]).split(' ')[0]) !== -1 ||
             q.explain.indexOf(q.choices[q.answer]) !== -1,
             'L' + lv.id + ': pembahasan memuat jawaban');
      assert(!seen[q.prompt], 'L' + lv.id + ': prompt unik');
      seen[q.prompt] = true;
      /* taksiran (bukan eksak) untuk tipe A/B: jawaban != nilai eksak */
      if (q.meta.kind === 'estop' || q.meta.kind === 'estpct') {
        assert(q.prompt.indexOf('≈') !== -1, 'L' + lv.id + ': ada simbol ≈');
      }
      /* pembulatan operand wajar: menyimpang maks 12% */
      if (q.meta.kind === 'estop') {
        var ea = Math.abs(q.meta.ra - q.meta.a) / q.meta.a;
        var eb = Math.abs(q.meta.rb - q.meta.b) / q.meta.b;
        assert(ea <= 0.12 && eb <= 0.12,
          'L' + lv.id + ': taksiran wajar (' + q.meta.a + '≈' + q.meta.ra + ', ' + q.meta.b + '≈' + q.meta.rb + ')');
      }
      if (q.meta.kind === 'estpct') {
        var ep = Math.abs(q.meta.rbase - q.meta.base) / q.meta.base;
        assert(ep <= 0.12, 'L' + lv.id + ': basis persen wajar (' + q.meta.base + '≈' + q.meta.rbase + ')');
      }
    });
  }
});

/* 4. Level 4: campuran Wajar/Tidak wajar */
var w = 0, tw = 0;
for (var j = 0; j < 200; j++) {
  Q.genQuestions(4).forEach(function (q) {
    if (q.meta.wajar) w++; else tw++;
  });
}
assert(w > 0 && tw > 0, 'L4 ada Wajar dan Tidak wajar');

/* 5. Level 5 mencakup semua tipe */
var kinds = {};
for (var k = 0; k < 200; k++) {
  Q.genQuestions(5).forEach(function (q) { kinds[q.meta.kind] = true; });
}
assert(kinds.estop && kinds.estpct && kinds.reason, 'L5 campuran semua tipe');

console.log('Selesai: ' + total + ' assertions, ' + fails + ' gagal.');
process.exit(fails ? 1 : 0);
