/* =====================================================================
 * Dompet Pintar — bank soal & generator literasi finansial
 * Game Matematika SMP • Materi: Aritmetika Sosial / Literasi Finansial
 * Misi: diskon, untung-rugi, bunga tabungan, pajak.
 * Semua rupiah bulat (tanpa sen). Murni JavaScript, tanpa dependensi.
 * Bisa diuji dengan Node.
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

/* Format angka gaya Indonesia: 12000 -> "12.000" (dipakai game.js) */
function fmt(n) {
  return Number(n).toLocaleString('id-ID');
}

function rp(n) {
  return 'Rp' + fmt(n);
}

/* Parse "Rp150.000" / "25%" / "150.000" kembali menjadi angka. */
function parseNum(s) {
  s = String(s).trim().replace(/^Rp/i, '').replace(/\./g, '').replace(',', '.');
  var pct = false;
  if (s.charAt(s.length - 1) === '%') { pct = true; s = s.slice(0, -1); }
  var v = Number(s);
  return pct ? v : v;
}

/* ---------------- pembangun soal ---------------- */

function makeQ(prompt, correct, distractors, explain, hint, meta) {
  correct = String(correct);
  var seen = {};
  seen[correct] = true;
  var ds = [];
  var pool = shuffle(distractors.map(String));
  for (var i = 0; i < pool.length && ds.length < 3; i++) {
    if (!seen[pool[i]]) { seen[pool[i]] = true; ds.push(pool[i]); }
  }
  var guard = 0;
  while (ds.length < 3 && guard++ < 80) {
    var f = correct + ' ?';
    if (!seen[f]) { seen[f] = true; ds.push(f); }
  }
  var choices = shuffle([correct].concat(ds));
  return {
    prompt: prompt,
    choices: choices,
    answer: choices.indexOf(correct),
    explain: explain,
    hint: hint,
    meta: meta || null
  };
}

function collect(n, gens) {
  var qs = [];
  var seen = {};
  var guard = 0;
  while (qs.length < n && guard++ < n * 80) {
    var q = pick(gens)();
    if (!seen[q.prompt]) { seen[q.prompt] = true; qs.push(q); }
  }
  return qs;
}

/* Pengecoh rupiah di sekitar jawaban benar. */
function rpDistractors(correct, traps) {
  var out = [];
  var cands = [correct * 2, correct / 2, correct + correct * 0.1,
               correct - correct * 0.1, correct + 10000, correct - 10000,
               correct + 5000, correct - 5000];
  var seen = {};
  cands.forEach(function (c) {
    if (c <= 0 || Math.round(c) !== c) return;
    var s = rp(c);
    if (!seen[s]) { seen[s] = true; out.push(s); }
  });
  return traps.concat(out);
}

var BARANG = ['sepatu', 'tas', 'kemeja', 'celana panjang', 'jaket', 'buku cerita',
              'mainan robot', 'topi', 'dompet', 'kaos'];

/* ---------------- MISI 1: Diskon ---------------- */

function trikDiskon(d, P) {
  var sepuluh = P / 10;
  if (d === 10) return 'Trik: 10% artinya bagi harga dengan 10 → ' + rp(sepuluh) + '.';
  if (d === 20) return 'Trik: 10% = ' + rp(sepuluh) + ', jadi 20% = 2 × ' + rp(sepuluh) + '.';
  if (d === 25) return 'Trik: 25% = 1/4, jadi ' + rp(P) + ' ÷ 4.';
  if (d === 50) return 'Trik: 50% = setengah harga.';
  return 'Trik: 75% = 3/4. Hitung 1/4 dulu (' + rp(P) + ' ÷ 4), lalu × 3.';
}

function qDiskon() {
  var d = pick([10, 20, 25, 50, 75]);
  var P = pick([4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50]) * 10000;
  var barang = pick(BARANG);
  var disc = P * d / 100;
  var pay = P - disc;
  var variant = pick(['pay', 'disc', 'reverse']);
  var hint = trikDiskon(d, P);
  if (variant === 'pay') {
    return makeQ(
      'Di toko, ' + barang + ' seharga <b>' + rp(P) + '</b> didiskon <b>' + d + '%</b>. Berapa rupiah yang harus dibayar?',
      rp(pay),
      rpDistractors(pay, [rp(disc), rp(P)]),
      'Diskon = ' + d + '% × ' + rp(P) + ' = ' + rp(disc) + '. Bayar = ' + rp(P) + ' − ' + rp(disc) + ' = <b>' + rp(pay) + '</b>.',
      hint,
      { kind: 'diskon', ans: pay, P: P, d: d }
    );
  }
  if (variant === 'disc') {
    return makeQ(
      'Harga ' + barang + ' <b>' + rp(P) + '</b>, diskon <b>' + d + '%</b>. Berapa rupiah besar potongannya?',
      rp(disc),
      rpDistractors(disc, [rp(pay), rp(P)]),
      'Potongan = ' + d + '% × ' + rp(P) + ' = <b>' + rp(disc) + '</b>.',
      hint,
      { kind: 'diskon', ans: disc, P: P, d: d }
    );
  }
  return makeQ(
    'Setelah didiskon <b>' + d + '%</b>, ' + barang + ' dibayar seharga <b>' + rp(pay) + '</b>. Berapa harga awalnya?',
    rp(P),
    rpDistractors(P, [rp(disc), rp(pay)]),
    'Bayar ' + (100 - d) + '% dari harga awal. Harga awal = ' + rp(pay) + ' ÷ ' + (100 - d) + '% = <b>' + rp(P) + '</b>.',
    hint,
    { kind: 'diskon', ans: P, P: P, d: d }
  );
}

/* ---------------- MISI 2: Untung & Rugi ---------------- */

function qUntungRugi() {
  var B = pick([20000, 25000, 40000, 50000, 80000, 100000]);
  var untung = Math.random() < 0.6;
  var barang = pick(['kue', 'mainan', 'pulpen', 'topi', 'kaos', 'tas']);
  var hint = 'Trik: Untung% = (Jual − Beli) ÷ Beli × 100%.';
  if (untung) {
    var p = pick([10, 20, 25, 50]);
    var S = B * (100 + p) / 100;
    var variant = pick(['pct', 'sell', 'buy']);
    if (variant === 'pct') {
      return makeQ(
        'Pak Budi membeli ' + barang + ' seharga <b>' + rp(B) + '</b> lalu menjualnya <b>' + rp(S) + '</b>. Berapa persen keuntungannya?',
        p + '%',
        [(p + 5) + '%', (p - 5) + '%', (p * 2) + '%', Math.max(1, Math.round(p / 2)) + '%'],
        'Untung = ' + rp(S) + ' − ' + rp(B) + ' = ' + rp(S - B) + '. Persentase = ' + rp(S - B) + ' ÷ ' + rp(B) + ' × 100% = <b>' + p + '%</b>.',
        hint,
        { kind: 'untung', ans: p, pct: true }
      );
    }
    if (variant === 'sell') {
      return makeQ(
        'Bu Sari membeli ' + barang + ' <b>' + rp(B) + '</b> dan ingin untung <b>' + p + '%</b>. Berapa harga jualnya?',
        rp(S),
        rpDistractors(S, [rp(B), rp(S - B)]),
        'Untung = ' + p + '% × ' + rp(B) + ' = ' + rp(S - B) + '. Jual = ' + rp(B) + ' + ' + rp(S - B) + ' = <b>' + rp(S) + '</b>.',
        hint,
        { kind: 'untung', ans: S, B: B, p: p }
      );
    }
    return makeQ(
      barang + ' dijual <b>' + rp(S) + '</b> dengan keuntungan <b>' + p + '%</b>. Berapa harga belinya?',
      rp(B),
      rpDistractors(B, [rp(S), rp(S - B)]),
      'Harga beli = ' + rp(S) + ' ÷ ' + (100 + p) + '% = <b>' + rp(B) + '</b>.',
      hint,
      { kind: 'untung', ans: B, S: S, p: p }
    );
  }
  var r = pick([10, 20, 25]);
  var S2 = B * (100 - r) / 100;
  return makeQ(
    'Karena sepi, ' + barang + ' yang dibeli <b>' + rp(B) + '</b> terpaksa dijual <b>' + rp(S2) + '</b>. Berapa persen kerugiannya?',
    r + '%',
    [(r + 5) + '%', Math.max(1, r - 5) + '%', (r * 2) + '%'],
    'Rugi = ' + rp(B) + ' − ' + rp(S2) + ' = ' + rp(B - S2) + '. Persentase = ' + rp(B - S2) + ' ÷ ' + rp(B) + ' × 100% = <b>' + r + '%</b>.',
    'Trik: Rugi% = (Beli − Jual) ÷ Beli × 100%.',
    { kind: 'rugi', ans: r, pct: true }
  );
}

/* ---------------- MISI 3: Bunga Tabungan ---------------- */

function qBunga() {
  var P = pick([500000, 1000000, 2000000]);
  var r = pick([1, 2, 5]);
  var n = pick([3, 6, 12]);
  var bunga = P * r / 100 * n;
  var total = P + bunga;
  var hint = 'Trik: Bunga = Modal × % × waktu. ' + r + '% dari ' + rp(P) + ' = ' + rp(P * r / 100) + ' per bulan.';
  if (Math.random() < 0.5) {
    return makeQ(
      'Ayah menabung <b>' + rp(P) + '</b> dengan bunga <b>' + r + '% per bulan</b> selama <b>' + n + ' bulan</b> (bunga tunggal). Berapa bunga yang diperoleh?',
      rp(bunga),
      rpDistractors(bunga, [rp(total), rp(P)]),
      'Bunga = ' + rp(P) + ' × ' + r + '% × ' + n + ' = <b>' + rp(bunga) + '</b>.',
      hint,
      { kind: 'bunga', ans: bunga }
    );
  }
  return makeQ(
    'Ibu menabung <b>' + rp(P) + '</b> dengan bunga <b>' + r + '% per bulan</b> selama <b>' + n + ' bulan</b> (bunga tunggal). Berapa total tabungannya?',
    rp(total),
    rpDistractors(total, [rp(bunga), rp(P)]),
    'Bunga = ' + rp(P) + ' × ' + r + '% × ' + n + ' = ' + rp(bunga) + '. Total = ' + rp(P) + ' + ' + rp(bunga) + ' = <b>' + rp(total) + '</b>.',
    hint,
    { kind: 'bunga', ans: total }
  );
}

/* ---------------- MISI 4: Pajak ---------------- */

function qPajak() {
  var P = pick([50000, 80000, 100000, 150000, 200000]);
  var pajak = P / 10;
  var total = P + pajak;
  var hint = 'Trik: Pajak 10% = harga ÷ 10.';
  var variant = pick(['total', 'pajak', 'reverse']);
  if (variant === 'total') {
    return makeQ(
      'Makan di restoran habis <b>' + rp(P) + '</b>, ditambah pajak <b>10%</b>. Berapa total yang dibayar?',
      rp(total),
      rpDistractors(total, [rp(pajak), rp(P)]),
      'Pajak = 10% × ' + rp(P) + ' = ' + rp(pajak) + '. Total = ' + rp(P) + ' + ' + rp(pajak) + ' = <b>' + rp(total) + '</b>.',
      hint,
      { kind: 'pajak', ans: total }
    );
  }
  if (variant === 'pajak') {
    return makeQ(
      'Tagihan restoran <b>' + rp(P) + '</b> dikenai pajak <b>10%</b>. Berapa rupiah pajaknya?',
      rp(pajak),
      rpDistractors(pajak, [rp(total), rp(P)]),
      'Pajak = 10% × ' + rp(P) + ' = <b>' + rp(pajak) + '</b>.',
      hint,
      { kind: 'pajak', ans: pajak }
    );
  }
  return makeQ(
    'Total bayar di kasir <b>' + rp(total) + '</b> sudah termasuk pajak <b>10%</b>. Berapa harga makanannya saja?',
    rp(P),
    rpDistractors(P, [rp(pajak), rp(total)]),
    'Harga asli = ' + rp(total) + ' ÷ 110% = <b>' + rp(P) + '</b>.',
    hint,
    { kind: 'pajak', ans: P }
  );
}

/* ---------------- konfigurasi level ---------------- */

var LEVELS = [
  { id: 1, name: 'Misi Belanja', desc: 'Diskon di toko', time: 40, count: 6, pass: 4, mult: 1, icon: '🛍️' },
  { id: 2, name: 'Juragan Untung', desc: 'Untung & rugi persen', time: 35, count: 6, pass: 4, mult: 2, icon: '📈' },
  { id: 3, name: 'Misi Menabung', desc: 'Bunga tabungan', time: 35, count: 6, pass: 4, mult: 3, icon: '🏦' },
  { id: 4, name: 'Pajak & Nota', desc: 'Pajak 10%', time: 30, count: 6, pass: 4, mult: 4, icon: '🧾' },
  { id: 5, name: 'Juragan Sejati', desc: 'Campuran semua misi', time: 25, count: 8, pass: 5, mult: 5, icon: '👑' }
];

function genFor(levelId) {
  if (levelId === 1) return qDiskon;
  if (levelId === 2) return qUntungRugi;
  if (levelId === 3) return qBunga;
  if (levelId === 4) return qPajak;
  return function () { return pick([qDiskon, qUntungRugi, qBunga, qPajak])(); };
}

function genQuestions(levelId) {
  var lv = LEVELS[levelId - 1];
  if (!lv) throw new Error('Level tidak dikenal: ' + levelId);
  return collect(lv.count, [genFor(levelId)]);
}

/* ---------------- verifikasi (untuk pengujian) ---------------- */

var VERIFY = {
  money: function (q) {
    return parseNum(q.choices[q.answer]) === q.meta.ans;
  },
  pct: function (q) {
    return parseNum(q.choices[q.answer]) === q.meta.ans;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LEVELS: LEVELS,
    genQuestions: genQuestions,
    VERIFY: VERIFY,
    rand: rand, pick: pick, shuffle: shuffle,
    fmt: fmt, rp: rp, parseNum: parseNum,
    makeQ: makeQ, qDiskon: qDiskon, qUntungRugi: qUntungRugi,
    qBunga: qBunga, qPajak: qPajak
  };
}
