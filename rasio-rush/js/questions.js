/* =====================================================================
 * Rasio Rush — bank soal & generator
 * Game Matematika SMP • Materi: Rasio (Kelas 7)
 * Murni JavaScript, tanpa dependensi. Bisa diuji dengan Node.
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

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { var t = a % b; a = b; b = t; }
  return a || 1;
}

/* Format angka gaya Indonesia: 12000 -> "12.000" */
function fmt(n) {
  return n.toLocaleString('id-ID');
}

function rp(n) {
  return 'Rp ' + fmt(n);
}

/* ---------------- pembangun soal ----------------
 * Soal: { prompt, choices[4], answer (index), explain, meta }
 */

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
  while (ds.length < 3 && guard++ < 60) {
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

/* Pengecoh angka yang masuk akal: selisih kecil, kelipatan, dsb. */
function numDistractors(v) {
  var pool = [v + 1, v - 1, v + 2, v - 2, v + 3, v + 5, v - 5,
              v + 10, v - 10, v * 2, Math.round(v / 2), v * 3,
              v + 7, v + 13, v + 20, v + 25];
  var out = [];
  var seen = {};
  seen[v] = true;
  var sp = shuffle(pool);
  for (var i = 0; i < sp.length && out.length < 6; i++) {
    var c = sp[i];
    if (c > 0 && Number.isInteger(c) && !seen[c]) {
      seen[c] = true;
      out.push(c);
    }
  }
  return out;
}

/* Kumpulkan n soal unik (berdasar prompt) dari daftar generator. */
function collect(n, gens) {
  var qs = [];
  var seen = {};
  var guard = 0;
  while (qs.length < n && guard++ < n * 60) {
    var q = pick(gens)();
    if (!seen[q.prompt]) { seen[q.prompt] = true; qs.push(q); }
  }
  return qs;
}

/* ---------------- LEVEL 1: Dasar Rasio ---------------- */

var COPRIME = [[2, 3], [3, 4], [4, 5], [3, 5], [2, 5], [5, 6],
               [4, 7], [3, 7], [5, 8], [2, 7], [4, 9], [5, 9]];

function qSimplify() {
  var ab = pick(COPRIME);
  var a = ab[0], b = ab[1];
  var k = rand(2, 9);
  var A = a * k, B = b * k;
  var correct = a + ' : ' + b;
  return makeQ(
    'Sederhanakan rasio <b>' + A + ' : ' + B + '</b>.',
    correct,
    [b + ' : ' + a, A + ' : ' + B, (a + 1) + ' : ' + b, a + ' : ' + (b + 1)],
    'Bagi kedua suku dengan FPB(' + A + ', ' + B + ') = ' + k +
      ', sehingga ' + A + ' : ' + B + ' = <b>' + correct + '</b>.',
    { kind: 'simplify', a0: A, b0: B }
  );
}

function qFraction() {
  var ab = pick(COPRIME);
  var a = ab[0], b = ab[1];
  var k = rand(2, 8);
  var A = a * k, B = b * k;
  var correct = a + '/' + b;
  return makeQ(
    'Rasio <b>' + A + ' : ' + B + '</b> jika dinyatakan sebagai pecahan paling sederhana adalah ...',
    correct,
    [b + '/' + a, A + '/' + B, (a + 1) + '/' + b],
    'Rasio ' + A + ' : ' + B + ' sama dengan pecahan ' + A + '/' + B +
      '. Sederhanakan dengan membagi pembilang dan penyebut dengan ' + k +
      ' menjadi <b>' + correct + '</b>.',
    { kind: 'fraction', a0: A, b0: B }
  );
}

function qWordRasio() {
  var ab = pick(COPRIME);
  var a = ab[0], b = ab[1];
  var k = rand(2, 6);
  var L = a * k, P = b * k;
  var correct = a + ' : ' + b;
  return makeQ(
    'Di kelas 7A terdapat <b>' + L + ' siswa laki-laki</b> dan <b>' + P +
      ' siswa perempuan</b>. Rasio banyak siswa laki-laki terhadap siswa perempuan adalah ...',
    correct,
    [b + ' : ' + a, L + ' : ' + P, (a + 1) + ' : ' + b],
    'Rasio = ' + L + ' : ' + P + '. Sederhanakan dengan membagi kedua suku dengan ' +
      k + ' menjadi <b>' + correct + '</b>.',
    { kind: 'simplify', a0: L, b0: P }
  );
}

function genL1(n) {
  return collect(n, [qSimplify, qSimplify, qFraction, qWordRasio]);
}

/* ---------------- LEVEL 2: Rasio Senilai ---------------- */

function qSenilai() {
  var ab = pick(COPRIME);
  var a = ab[0], b = ab[1];
  var k = rand(2, 9);
  var c = a * k, x = b * k;
  return makeQ(
    'Diketahui <b>' + a + ' : ' + b + ' = ' + c + ' : n</b>. Nilai <i>n</i> adalah ...',
    String(x),
    numDistractors(x).map(String),
    'Rasio senilai: ' + c + ' = ' + a + ' × ' + k +
      ', maka n = ' + b + ' × ' + k + ' = <b>' + x + '</b>.',
    { kind: 'senilai', a: a, b: b, c: c, x: x }
  );
}

function qRecipe() {
  var P = pick([4, 5, 6, 8, 10]);
  var u = pick([20, 25, 30, 40, 50]); /* gram per kue */
  var mult = pick([2, 3, 4]);
  var Q = P * mult;
  var ans = Q * u;
  var bahan = pick(['tepung terigu', 'gula pasir', 'mentega', 'cokelat bubuk']);
  return makeQ(
    'Untuk membuat <b>' + P + ' kue</b> dibutuhkan <b>' + fmt(P * u) + ' gram ' + bahan +
      '</b>. Jika ingin membuat <b>' + Q + ' kue</b>, ' + bahan + ' yang dibutuhkan adalah ... gram.',
    fmt(ans),
    numDistractors(ans).map(fmt),
    'Banyak kue menjadi ' + mult + ' kali lipat (' + P + ' → ' + Q +
      '), maka bahan juga dikali ' + mult + ': ' + fmt(P * u) + ' × ' + mult +
      ' = <b>' + fmt(ans) + ' gram</b>.',
    { kind: 'recipe', Q: Q, u: u, ans: ans }
  );
}

function qPrice() {
  var N = pick([4, 5, 6, 8]);
  var p = pick([1500, 2000, 2500, 3000]);
  var mult = pick([2, 3]);
  var K = N * mult;
  var ans = K * p;
  var barang = pick(['pensil', 'buku tulis', 'penghapus', 'penggaris']);
  return makeQ(
    'Harga <b>' + N + ' ' + barang + '</b> adalah <b>' + rp(N * p) +
      '</b>. Harga <b>' + K + ' ' + barang + '</b> adalah ...',
    rp(ans),
    numDistractors(ans).map(rp),
    'Banyak barang menjadi ' + mult + ' kali lipat, maka harga juga dikali ' + mult +
      ': ' + rp(N * p) + ' × ' + mult + ' = <b>' + rp(ans) + '</b>.',
    { kind: 'price', K: K, p: p, ans: ans }
  );
}

function genL2(n) {
  return collect(n, [qSenilai, qSenilai, qRecipe, qPrice]);
}

/* ---------------- LEVEL 3: Skala ---------------- */

var SCALES = [100000, 200000, 250000, 400000, 500000];

function qScaleToReal() {
  var N, d, real;
  var guard = 0;
  do {
    N = pick(SCALES); d = rand(2, 9); real = d * N / 100000;
  } while (!Number.isInteger(real) && guard++ < 100);
  return makeQ(
    'Jarak dua kota pada peta berskala <b>1 : ' + fmt(N) + '</b> adalah <b>' + d +
      ' cm</b>. Jarak sebenarnya kedua kota adalah ... km.',
    fmt(real),
    numDistractors(real).map(fmt).concat([fmt(d * N)]),
    'Jarak sebenarnya = ' + d + ' × ' + fmt(N) + ' = ' + fmt(d * N) +
      ' cm = <b>' + fmt(real) + ' km</b>.',
    { kind: 'scaleReal', d: d, N: N, real: real }
  );
}

function qScaleToMap() {
  var N, R, map;
  var guard = 0;
  do {
    N = pick(SCALES);
    R = pick([6, 8, 10, 12, 15, 20, 24, 25, 30]);
    map = R * 100000 / N;
  } while ((!Number.isInteger(map) || map < 2) && guard++ < 100);
  return makeQ(
    'Jarak sebenarnya dua kota adalah <b>' + R + ' km</b>. Pada peta berskala <b>1 : ' +
      fmt(N) + '</b>, jarak kedua kota tersebut adalah ... cm.',
    fmt(map),
    numDistractors(map).map(fmt),
    R + ' km = ' + fmt(R * 100000) + ' cm. Jarak pada peta = ' + fmt(R * 100000) +
      ' ÷ ' + fmt(N) + ' = <b>' + map + ' cm</b>.',
    { kind: 'scaleMap', R: R, N: N, map: map }
  );
}

function qDenah() {
  var s = pick([100, 200, 250]);
  var d, m;
  var guard = 0;
  do {
    d = rand(3, 9); m = d * s / 100;
  } while (!Number.isInteger(m) && guard++ < 100);
  var ruang = pick(['ruang tamu', 'kamar tidur', 'dapur', 'ruang keluarga']);
  return makeQ(
    'Denah rumah berskala <b>1 : ' + s + '</b>. Panjang ' + ruang + ' pada denah adalah <b>' +
      d + ' cm</b>. Panjang sebenarnya adalah ... m.',
    fmt(m),
    numDistractors(m).map(fmt),
    'Panjang sebenarnya = ' + d + ' × ' + s + ' = ' + fmt(d * s) +
      ' cm = <b>' + m + ' m</b>.',
    { kind: 'denah', d: d, s: s, m: m }
  );
}

function genL3(n) {
  return collect(n, [qScaleToReal, qScaleToReal, qScaleToMap, qDenah]);
}

/* ---------------- LEVEL 4: Kecepatan ---------------- */

function qSpeed() {
  var s, t, v;
  var guard = 0;
  do {
    s = pick([60, 80, 100, 120, 150, 180, 200, 240]);
    t = pick([2, 3, 4, 5, 6]);
    v = s / t;
  } while (!Number.isInteger(v) && guard++ < 100);
  var kend = pick(['mobil', 'motor', 'bus', 'kereta']);
  return makeQ(
    'Sebuah ' + kend + ' menempuh jarak <b>' + s + ' km</b> dalam waktu <b>' + t +
      ' jam</b>. Kecepatan rata-rata ' + kend + ' tersebut adalah ... km/jam.',
    String(v),
    numDistractors(v).map(String),
    'Kecepatan = jarak ÷ waktu = ' + s + ' ÷ ' + t + ' = <b>' + v + ' km/jam</b>.',
    { kind: 'speed', s: s, t: t, v: v }
  );
}

function qDistance() {
  var v = pick([40, 50, 60, 70, 80]);
  var t = pick([2, 3, 4, 5]);
  var s = v * t;
  return makeQ(
    'Andi bersepeda dengan kecepatan <b>' + v + ' km/jam</b> selama <b>' + t +
      ' jam</b>. Jarak yang ditempuh Andi adalah ... km.',
    String(s),
    numDistractors(s).map(String),
    'Jarak = kecepatan × waktu = ' + v + ' × ' + t + ' = <b>' + s + ' km</b>.',
    { kind: 'distance', v: v, t: t, s: s }
  );
}

function qTime() {
  var combos = [[150, 50, 3], [120, 60, 2], [200, 50, 4], [180, 60, 3],
                [240, 80, 3], [100, 25, 4], [90, 30, 3], [160, 40, 4]];
  var c = pick(combos);
  var s = c[0], v = c[1], t = c[2];
  return makeQ(
    'Jarak rumah ke sekolah <b>' + s + ' km</b> ditempuh dengan kecepatan <b>' + v +
      ' km/jam</b>. Waktu yang dibutuhkan adalah ... jam.',
    String(t),
    numDistractors(t).map(String),
    'Waktu = jarak ÷ kecepatan = ' + s + ' ÷ ' + v + ' = <b>' + t + ' jam</b>.',
    { kind: 'time', s: s, v: v, t: t }
  );
}

function qDebit() {
  var d = pick([2, 3, 4, 5, 6]);
  var t = pick([10, 12, 15, 20]);
  var V = d * t;
  return makeQ(
    'Debit sebuah keran air adalah <b>' + d + ' liter/menit</b>. Volume air yang keluar selama ' +
      '<b>' + t + ' menit</b> adalah ... liter.',
    String(V),
    numDistractors(V).map(String),
    'Volume = debit × waktu = ' + d + ' × ' + t + ' = <b>' + V + ' liter</b>.',
    { kind: 'debit', d: d, t: t, V: V }
  );
}

function genL4(n) {
  return collect(n, [qSpeed, qSpeed, qDistance, qTime, qDebit]);
}

/* ---------------- LEVEL 5: Bos Terakhir ---------------- */

function qInverse() {
  var combos = [[4, 12, 6, 8], [6, 12, 9, 8], [5, 20, 10, 10], [8, 12, 6, 16],
                [9, 12, 6, 18], [10, 15, 6, 25], [12, 10, 5, 24], [6, 15, 10, 9]];
  var c = pick(combos);
  var w1 = c[0], d1 = c[1], w2 = c[2], d2 = c[3];
  var proyek = pick(['membangun jembatan', 'mengecat gedung sekolah', 'memanen padi',
                     'membangun jalan desa', 'merakit komputer']);
  return makeQ(
    '<b>' + w1 + ' pekerja</b> dapat menyelesaikan ' + proyek + ' dalam <b>' + d1 +
      ' hari</b>. Jika jumlah pekerja menjadi <b>' + w2 + ' orang</b> ' +
      '(dengan kecepatan kerja yang sama), pekerjaan akan selesai dalam ... hari.',
    String(d2),
    numDistractors(d2).map(String),
    'Ini perbandingan <b>berbalik nilai</b>: ' + w1 + ' × ' + d1 + ' = ' + w2 + ' × n, ' +
      'sehingga n = ' + (w1 * d1) + ' ÷ ' + w2 + ' = <b>' + d2 + ' hari</b>.',
    { kind: 'inverse', w1: w1, d1: d1, w2: w2, d2: d2 }
  );
}

function genL5(n) {
  var qs = collect(Math.min(4, n), [qInverse]);
  var mixed = [];
  mixed.push.apply(mixed, collect(3, [qSenilai, qRecipe, qPrice]));
  mixed.push.apply(mixed, collect(3, [qScaleToReal, qScaleToMap, qDenah]));
  mixed.push.apply(mixed, collect(3, [qSpeed, qDistance, qTime, qDebit]));
  var rest = shuffle(mixed).slice(0, Math.max(0, n - qs.length));
  return shuffle(qs.concat(rest));
}

/* ---------------- konfigurasi level ---------------- */

var LEVELS = [
  { id: 1, name: 'Dasar Rasio',  desc: 'Menyederhanakan & menyatakan rasio',
    time: 30, count: 8,  pass: 6, mult: 1, gen: genL1, icon: '🌱' },
  { id: 2, name: 'Rasio Senilai', desc: 'Mencari nilai yang belum diketahui',
    time: 25, count: 8,  pass: 6, mult: 2, gen: genL2, icon: '⚖️' },
  { id: 3, name: 'Skala',        desc: 'Peta, denah & model',
    time: 25, count: 8,  pass: 6, mult: 3, gen: genL3, icon: '🗺️' },
  { id: 4, name: 'Kecepatan',    desc: 'Jarak, waktu, kecepatan & debit',
    time: 20, count: 8,  pass: 6, mult: 4, gen: genL4, icon: '🏎️' },
  { id: 5, name: 'Bos Terakhir', desc: 'Berbalik nilai & campuran semua materi',
    time: 15, count: 10, pass: 7, mult: 5, gen: genL5, icon: '👑' }
];

function genQuestions(levelId) {
  var lv = LEVELS[levelId - 1];
  if (!lv) throw new Error('Level tidak dikenal: ' + levelId);
  return lv.gen(lv.count);
}

/* ---------------- verifikasi (untuk pengujian) ---------------- */

function digits(str) {
  return parseInt(String(str).replace(/\D/g, ''), 10);
}

var VERIFY = {
  simplify: function (q) {
    var r = q.choices[q.answer].split(':').map(function (s) { return parseInt(s.trim(), 10); });
    var m = q.meta;
    return gcd(r[0], r[1]) === 1 && m.a0 * r[1] === m.b0 * r[0];
  },
  fraction: function (q) {
    var p = q.choices[q.answer].split('/');
    var a = parseInt(p[0], 10), b = parseInt(p[1], 10);
    var m = q.meta;
    return gcd(a, b) === 1 && m.a0 * b === m.b0 * a;
  },
  senilai: function (q) {
    var m = q.meta;
    var x = parseInt(q.choices[q.answer], 10);
    return x === m.x && m.a * x === m.c * m.b;
  },
  recipe: function (q) {
    var m = q.meta;
    return digits(q.choices[q.answer]) === m.ans && m.Q * m.u === m.ans;
  },
  price: function (q) {
    var m = q.meta;
    return digits(q.choices[q.answer]) === m.ans && m.K * m.p === m.ans;
  },
  scaleReal: function (q) {
    var m = q.meta;
    return digits(q.choices[q.answer]) === m.real && m.d * m.N / 100000 === m.real;
  },
  scaleMap: function (q) {
    var m = q.meta;
    return digits(q.choices[q.answer]) === m.map && m.R * 100000 / m.N === m.map;
  },
  denah: function (q) {
    var m = q.meta;
    return digits(q.choices[q.answer]) === m.m && m.d * m.s / 100 === m.m;
  },
  speed: function (q) {
    var m = q.meta;
    var x = parseInt(q.choices[q.answer], 10);
    return x === m.v && m.s / m.t === m.v;
  },
  distance: function (q) {
    var m = q.meta;
    var x = parseInt(q.choices[q.answer], 10);
    return x === m.s && m.v * m.t === m.s;
  },
  time: function (q) {
    var m = q.meta;
    var x = parseInt(q.choices[q.answer], 10);
    return x === m.t && m.s / m.v === m.t;
  },
  debit: function (q) {
    var m = q.meta;
    var x = parseInt(q.choices[q.answer], 10);
    return x === m.V && m.d * m.t === m.V;
  },
  inverse: function (q) {
    var m = q.meta;
    var x = parseInt(q.choices[q.answer], 10);
    return x === m.d2 && m.w1 * m.d1 === m.w2 * m.d2;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LEVELS: LEVELS,
    genQuestions: genQuestions,
    VERIFY: VERIFY,
    rand: rand, pick: pick, shuffle: shuffle, gcd: gcd,
    makeQ: makeQ, numDistractors: numDistractors, fmt: fmt, rp: rp
  };
}
