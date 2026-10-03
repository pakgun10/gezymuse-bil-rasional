/* Uji logika Bedah Rasio: node test-bedah-rasio.js */
'use strict';
var D = require('./js/data.js');

var fails = 0, total = 0;
function assert(cond, msg) {
  total++;
  if (!cond) { fails++; console.log('GAGAL: ' + msg); }
}

/* 1. Semua item lab terverifikasi dari data numerik */
assert(D.LAB_ITEMS.length === 8, '8 kasus lab');
D.LAB_ITEMS.forEach(function (it, i) {
  assert(D.verifyLab(it), 'lab[' + i + '] "' + it.ctx + '" -> ' + it.answer);
  var idx = D.labAnswerIndex(it);
  assert(idx >= 0 && idx < 3, 'lab[' + i + ']: index valid');
  assert(D.LAB_CHOICES[idx], 'lab[' + i + ']: pilihan ada');
  assert(it.explain.indexOf('<b>') !== -1, 'lab[' + i + ']: pembahasan berformat');
});

/* 2. Semua item arena terverifikasi */
assert(D.ARENA_ITEMS.length === 8, '8 duel arena');
D.ARENA_ITEMS.forEach(function (it, i) {
  assert(D.verifyArena(it), 'arena[' + i + '] "' + it.ctx + '" -> ' + it.answer);
  var idx = D.arenaAnswerIndex(it);
  assert(idx >= 0 && idx < 3, 'arena[' + i + ']: index valid');
  assert(it.explain.indexOf('Kali silang') !== -1, 'arena[' + i + ']: ada kali silang');
});

/* 3. Distribusi jawaban */
var labDist = { senilai: 0, berbalik: 0, bukan: 0 };
D.LAB_ITEMS.forEach(function (it) { labDist[it.answer]++; });
assert(labDist.senilai >= 2 && labDist.berbalik >= 2 && labDist.bukan >= 2,
  'lab: distribusi seimbang ' + JSON.stringify(labDist));
var arenaDist = { '1': 0, '0': 0, '-1': 0 };
D.ARENA_ITEMS.forEach(function (it) { arenaDist[it.answer]++; });
assert(arenaDist['1'] >= 2 && arenaDist['0'] >= 1 && arenaDist['-1'] >= 2,
  'arena: distribusi ' + JSON.stringify(arenaDist));

/* 4. Uji negatif: ubah satu angka -> verifikasi harus gagal */
var bad = JSON.parse(JSON.stringify(D.LAB_ITEMS[0]));
bad.a += 1;
assert(!D.verifyLab(bad), 'lab: data rusak terdeteksi');
var bad2 = JSON.parse(JSON.stringify(D.ARENA_ITEMS[0]));
bad2.r1[0] -= 2; /* 2:3 -> 0:3, hasil banding berubah */
assert(!D.verifyArena(bad2), 'arena: data rusak terdeteksi');

/* 5. Konsep tidak kosong */
assert(D.KONSEP_LAB.length > 50 && D.KONSEP_ARENA.length > 50, 'konsep terisi');

console.log('Selesai: ' + total + ' assertions, ' + fails + ' gagal.');
process.exit(fails ? 1 : 0);
