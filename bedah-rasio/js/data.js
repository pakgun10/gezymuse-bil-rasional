/* =====================================================================
 * Bedah Rasio — data eksplorasi interaktif
 * Dua mode: Lab Klasifikasi (senilai / berbalik nilai / bukan keduanya)
 * dan Arena Banding (bandingkan dua rasio via kali silang).
 * Bisa diuji dengan Node.
 * ===================================================================== */
'use strict';

var KONSEP_LAB =
  '<b>SENILAI (perbandingan senilai):</b> dua keadaan a–b dan c–d disebut <i>senilai</i> ' +
  'jika a/b = c/d. Cara cepat: <b>kali silang</b> — cek apakah a×d = b×c.<br>' +
  '<b>BERBALIK NILAI:</b> jika a×b = c×d. Satu naik, yang lain turun.<br>' +
  '<b>BUKAN KEDUANYA:</b> jika kedua pengecekan gagal.';

var KONSEP_ARENA =
  'Untuk membandingkan <b>a : b</b> dengan <b>c : d</b>, gunakan ' +
  '<b>kali silang</b>: hitung a×d dan c×b, lalu bandingkan hasilnya.<br>' +
  'Contoh: 2:3 vs 3:5 → 2×5 = 10 dan 3×3 = 9. Karena 10 &gt; 9, maka 2:3 lebih besar dari 3:5.<br>' +
  'Ingat juga: rasio <i>bagian-ke-bagian</i> (12 laki-laki : 18 perempuan = 2:3) ' +
  'berbeda dengan rasio <i>bagian-ke-keseluruhan</i> (12 laki-laki : 30 siswa = 2:5).';

/* Lab: a,b = keadaan 1; c,d = keadaan 2 (satuan konsisten).
 * senilai ⟺ a*d = b*c ; berbalik ⟺ a*b = c*d */
var LAB_ITEMS = [
  {
    ctx: 'Harga jeruk di pasar',
    p1: ['3 kg jeruk', 'Rp45.000'], p2: ['5 kg jeruk', 'Rp75.000'],
    a: 3, b: 5, c: 45, d: 75,
    answer: 'senilai',
    explain: 'Cek senilai: 3 × 75 = 225 dan 5 × 45 = 225 — sama! ' +
      'Berat bertambah, harga bertambah sebanding → <b>senilai</b>.'
  },
  {
    ctx: 'Membangun pos ronda',
    p1: ['6 pekerja', '12 hari'], p2: ['9 pekerja', '8 hari'],
    a: 6, b: 12, c: 9, d: 8,
    answer: 'berbalik',
    explain: 'Cek berbalik nilai: 6 × 12 = 72 dan 9 × 8 = 72 — sama! ' +
      'Makin banyak pekerja, makin sedikit hari → <b>berbalik nilai</b>.'
  },
  {
    ctx: 'Harga gula di dua warung',
    p1: ['2 kg gula', 'Rp30.000'], p2: ['3 kg gula', 'Rp50.000'],
    a: 2, b: 3, c: 30, d: 50,
    answer: 'bukan',
    explain: 'Cek senilai: 2 × 50 = 100, sedangkan 3 × 30 = 90 — beda. ' +
      'Cek berbalik: 2 × 30 = 60, sedangkan 3 × 50 = 150 — beda. ' +
      '→ <b>bukan keduanya</b> (harga tidak proporsional).'
  },
  {
    ctx: 'Bensin motor ayah',
    p1: ['4 liter', '60 km'], p2: ['10 liter', '150 km'],
    a: 4, b: 10, c: 60, d: 150,
    answer: 'senilai',
    explain: 'Cek senilai: 4 × 150 = 600 dan 10 × 60 = 600 — sama! ' +
      '→ <b>senilai</b>.'
  },
  {
    ctx: 'Perjalanan ke rumah nenek',
    p1: ['60 km/jam', '4 jam'], p2: ['80 km/jam', '3 jam'],
    a: 60, b: 4, c: 80, d: 3,
    answer: 'berbalik',
    explain: 'Cek berbalik nilai: 60 × 4 = 240 dan 80 × 3 = 240 — sama! ' +
      'Makin cepat, makin singkat waktu → <b>berbalik nilai</b>.'
  },
  {
    ctx: 'Umur ayah dan anak',
    p1: ['Ayah 40 th', 'Anak 10 th'], p2: ['5 tahun lalu: 35 th', '5 tahun lalu: 5 th'],
    a: 40, b: 10, c: 35, d: 5,
    answer: 'bukan',
    explain: 'Cek senilai: 40 × 5 = 200, sedangkan 10 × 35 = 350 — beda. ' +
      'Cek berbalik: 40 × 10 = 400, sedangkan 35 × 5 = 175 — beda. ' +
      'Selisih umur tetap 30 tahun, tapi rasionya berubah (4:1 menjadi 7:1) → <b>bukan keduanya</b>.'
  },
  {
    ctx: 'Kue untuk acara sekolah',
    p1: ['2 lusin', 'Rp120.000'], p2: ['5 lusin', 'Rp300.000'],
    a: 2, b: 5, c: 120, d: 300,
    answer: 'senilai',
    explain: 'Cek senilai: 2 × 300 = 600 dan 5 × 120 = 600 — sama! → <b>senilai</b>.'
  },
  {
    ctx: 'Pakan ayam Pak RT',
    p1: ['12 ekor', '10 hari'], p2: ['15 ekor', '8 hari'],
    a: 12, b: 10, c: 15, d: 8,
    answer: 'berbalik',
    explain: 'Cek berbalik nilai: 12 × 10 = 120 dan 15 × 8 = 120 — sama! → <b>berbalik nilai</b>.'
  }
];

/* Arena: bandingkan r1=[a,b] vs r2=[c,d] via a*d lawan c*b.
 * answer: 1 = r1 lebih besar, 0 = sama, -1 = r2 lebih besar */
var ARENA_ITEMS = [
  {
    ctx: 'Dua resep sirup',
    r1: [2, 3], r1t: '2 : 3', r1d: '2 gelas sirup berbanding 3 gelas air',
    r2: [3, 5], r2t: '3 : 5', r2d: '3 gelas sirup berbanding 5 gelas air',
    answer: 1,
    explain: 'Kali silang: 2 × 5 = 10 dan 3 × 3 = 9. Karena 10 &gt; 9, ' +
      'maka <b>2 : 3 lebih besar</b> dari 3 : 5 (lebih manis).'
  },
  {
    ctx: 'Resep kue ibu',
    r1: [3, 4], r1t: '3 : 4', r1d: '3 sendok gula berbanding 4 sendok tepung',
    r2: [6, 8], r2t: '6 : 8', r2d: '6 sendok gula berbanding 8 sendok tepung',
    answer: 0,
    explain: 'Kali silang: 3 × 8 = 24 dan 4 × 6 = 24 — sama! ' +
      '6 : 8 = 3 : 4 (sama-sama dibagi 2) → <b>sama besar</b>.'
  },
  {
    ctx: 'Peluang menang undian',
    r1: [1, 2], r1t: '1 : 2', r1d: 'peluang kelas A',
    r2: [2, 5], r2t: '2 : 5', r2d: 'peluang kelas B',
    answer: 1,
    explain: 'Kali silang: 1 × 5 = 5 dan 2 × 2 = 4. Karena 5 &gt; 4, ' +
      'maka <b>1 : 2 lebih besar</b> dari 2 : 5.'
  },
  {
    ctx: 'Siswa kelas 7B: 12 laki-laki dan 18 perempuan',
    r1: [2, 3], r1t: '2 : 3', r1d: 'laki-laki berbanding perempuan (bagian-ke-bagian)',
    r2: [2, 5], r2t: '2 : 5', r2d: 'laki-laki berbanding seluruh siswa (bagian-ke-keseluruhan)',
    answer: 1,
    explain: 'Kali silang: 2 × 5 = 10 dan 3 × 2 = 6. Karena 10 &gt; 6, ' +
      'maka <b>2 : 3 lebih besar</b> dari 2 : 5. ' +
      'Hati-hati: 12:18 = 2:3, sedangkan 12:30 = 2:5 — pembaginya berbeda!'
  },
  {
    ctx: 'Perbandingan kelereng',
    r1: [3, 10], r1t: '3 : 10', r1d: 'kelereng Andi',
    r2: [1, 3], r2t: '1 : 3', r2d: 'kelereng Budi',
    answer: -1,
    explain: 'Kali silang: 3 × 3 = 9 dan 10 × 1 = 10. Karena 9 &lt; 10, ' +
      'maka <b>1 : 3 lebih besar</b> dari 3 : 10.'
  },
  {
    ctx: 'Kecepatan dua bus',
    r1: [120, 2], r1t: '120 : 2', r1d: '120 km dalam 2 jam (60 km/jam)',
    r2: [180, 4], r2t: '180 : 4', r2d: '180 km dalam 4 jam (45 km/jam)',
    answer: 1,
    explain: 'Kali silang: 120 × 4 = 480 dan 2 × 180 = 360. Karena 480 &gt; 360, ' +
      'maka bus pertama <b>lebih cepat</b>.'
  },
  {
    ctx: 'Campuran cat',
    r1: [2, 7], r1t: '2 : 7', r1d: '2 kaleng merah berbanding 7 kaleng putih',
    r2: [3, 10], r2t: '3 : 10', r2d: '3 kaleng merah berbanding 10 kaleng putih',
    answer: -1,
    explain: 'Kali silang: 2 × 10 = 20 dan 7 × 3 = 21. Karena 20 &lt; 21, ' +
      'maka campuran kedua <b>lebih merah</b> (3 : 10 lebih besar).'
  },
  {
    ctx: 'Nilai ulangan',
    r1: [35, 50], r1t: '35 : 50', r1d: '35 benar dari 50 soal',
    r2: [7, 10], r2t: '7 : 10', r2d: '7 benar dari 10 soal',
    answer: 0,
    explain: 'Kali silang: 35 × 10 = 350 dan 50 × 7 = 350 — sama! ' +
      '35 : 50 = 7 : 10 (sama-sama dibagi 5) → <b>sama besar</b>.'
  }
];

var LAB_CHOICES = ['Senilai', 'Berbalik nilai', 'Bukan keduanya'];
var ARENA_CHOICES = ['Rasio pertama lebih besar', 'Sama besar', 'Rasio kedua lebih besar'];

function labAnswerIndex(item) {
  return item.answer === 'senilai' ? 0 : item.answer === 'berbalik' ? 1 : 2;
}

function arenaAnswerIndex(item) {
  return item.answer === 1 ? 0 : item.answer === 0 ? 1 : 2;
}

/* Verifikasi jawaban dari data numerik (untuk pengujian). */
function verifyLab(item) {
  var senilai = item.a * item.d === item.b * item.c;
  var berbalik = item.a * item.b === item.c * item.d;
  var got = senilai ? 'senilai' : berbalik ? 'berbalik' : 'bukan';
  return got === item.answer;
}

function verifyArena(item) {
  var l = item.r1[0] * item.r2[1], r = item.r1[1] * item.r2[0];
  var got = l > r ? 1 : l < r ? -1 : 0;
  return got === item.answer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    KONSEP_LAB: KONSEP_LAB, KONSEP_ARENA: KONSEP_ARENA,
    LAB_ITEMS: LAB_ITEMS, ARENA_ITEMS: ARENA_ITEMS,
    LAB_CHOICES: LAB_CHOICES, ARENA_CHOICES: ARENA_CHOICES,
    labAnswerIndex: labAnswerIndex, arenaAnswerIndex: arenaAnswerIndex,
    verifyLab: verifyLab, verifyArena: verifyArena
  };
}
