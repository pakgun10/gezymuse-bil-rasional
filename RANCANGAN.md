# RANCANGAN: Arena Rasional
**Koleksi media interaktif digital — Matematika SMP**
**TP 1.** Mengidentifikasi, menyatakan, membandingkan, menentukan operasi hitung
(+, −, ×, ÷), menaksir, dan melakukan estimasi **bilangan rasional** serta
menyelesaikan permasalahan kontekstual terkait, termasuk penguatan
**literasi finansial**.
**TP 2.** Menjelaskan, membedakan, membandingkan, dan menentukan **rasio**
(skala, proporsi, laju perubahan) serta menyelesaikan permasalahan
kontekstual terkait.

Disusun: 2026-10-03 • Status: rancangan, menunggu persetujuan Pak Gun

## 1. Konsep Pengelompokan

Satu **portal** (`index.html`) berisi semua game, dikelompokkan per TP.
Struktur: 1 repo, tiap game di subfolder sendiri, 100% statis → GitHub Pages.
Game yang **sudah ada** disalin masuk (snapshot) agar koleksi mandiri dalam
1 repo dan tetap bisa dibuka offline dari zip:
- ⚡ **Rasio Rush** → masuk seksi TP 2 (materi: dasar rasio, senilai/proporsi,
  skala, kecepatan, berbalik nilai).
- 🧩 **Kartu Persamaan** → masuk seksi TP 1 sebagai penguat prasyarat
  (operasi hitung bilangan bulat & pecahan).
- (Opsional, bila diinginkan) media Arena Bilangan Bulat sebagai seksi
  "Prasyarat: Bilangan Bulat".

## 2. Peta TP → Game (baru = usulan, ada = sudah jadi)

### SEKSI TP 1 — Bilangan Rasional

| # | Game | Status | Unsur TP yang dicakup |
|---|------|--------|----------------------|
| 1 | 🔄 **Ubah Bentuk** | baru | mengidentifikasi, menyatakan: pecahan ↔ desimal ↔ persen |
| 2 | ⚖️ **Banding Rasional** | baru | membandingkan (+mengurutkan): pecahan vs desimal vs persen |
| 3 | 🧩 Kartu Persamaan | ada | menentukan hasil operasi hitung (+, −, ×, ÷) |
| 4 | 🎯 **Taksir Cepat** | baru | menaksir & estimasi: hasil operasi dan persen |
| 5 | 💰 **Dompet Pintar** | baru | kontekstual + literasi finansial berbasis persen (diskon, untung/rugi %, bunga) |

### SEKSI TP 2 — Rasio

| # | Game | Status | Unsur TP yang dicakup |
|---|------|--------|----------------------|
| 6 | ⚡ Rasio Rush | ada | menjelaskan & menentukan rasio: skala, proporsi (senilai), laju (kecepatan), kontekstual |
| 7 | 🔍 **Bedah Rasio** | baru | **membedakan**: senilai vs berbalik nilai vs bukan rasio; **membandingkan** dua rasio |
| 8 | 🏎️ **Laju Perubahan** | baru | **laju perubahan**: kecepatan, debit, perubahan per satuan waktu + membaca tabel/grafik sederhana |

## 3. Desain Tiap Game Baru

### 3.1 🔄 Ubah Bentuk (game kuis cepat, pola Rasio Rush)
- Soal: "Bentuk desimal dari 3/4 adalah …", "45% = … (pecahan paling sederhana)".
- 5 level: L1 pecahan↔desimal (penyebut 2,4,5,10); L2 + persen; L3 pecahan campuran;
  L4 desimal↔persen dua arah; L5 campuran cepat (waktu 15 dtk).
- Timer, 4 opsi, nyawa, kombo, pembahasan tiap soal.

### 3.2 ⚖️ Banding Rasional (game susun, pola Urutkan Kilat)
- Susun 5–6 kartu **campuran bentuk** (mis. 2/3, 0,6, 45%, −1/2) dari terkecil
  ke terbesar, tap-to-place.
- Kartu di-generate dengan nilai unik; validasi eksak via pecahan (tanpa float).
- 5 level: makin banyak bentuk campuran & rentang negatif.

### 3.3 🎯 Taksir Cepat (game estimasi)
- Tiga tipe soal: (a) "47 × 32 ≈ …" pilih taksiran terdekat;
  (b) "20% dari 85 ≈ …"; (c) "Cek kewajaran": "12 × 98 = 11.766, wajar?"
  (Ya/Tidak + alasan).
- Penilaian: jawaban benar = taksiran dalam toleransi yang ditentukan generator.
- 5 level: bulat → desimal → persen → campuran cepat.

### 3.4 💰 Dompet Pintar (game misi cerita)
- 5 misi belanja/keuangan: diskon ("Rp200rb diskon 25% → bayar?"),
  untung/rugi persen, bunga tabungan sederhana, pajak 10%.
- Tiap misi: skenario + 2–3 soal pilihan ganda; ada "kalkulator taksir"
  (bukan kalkulator penuh — melatih estimasi persen).
- Skor akhir + predikat ("Ahli Finansial 🏆").

### 3.5 🔍 Bedah Rasio (eksplorasi interaktif, bukan game bernyawa)
- **Lab Klasifikasi**: diberi pasangan besaran → golongkan: *senilai*,
  *berbalik nilai*, atau *bukan rasio* (dengan penjelasan).
- **Arena Banding**: bandingkan dua rasio (mis. 2:3 vs 3:5) dengan visual
  perkalian silang; bedakan rasio *bagian-ke-bagian* vs *bagian-ke-keseluruhan*.
- Mode latihan tanpa timer + kunci penjelasan.

### 3.6 🏎️ Laju Perubahan (game skenario)
- Soal kontekstual laju: kecepatan, debit air, "harga naik Rp2.000/bulan",
  "tinggi tanaman bertambah 3 cm/minggu".
- Visual: tabel & grafik garis sederhana yang bisa dibaca ("laju = …/jam").
- 5 level: laju tetap → laju dari tabel → laju dari grafik → campuran.

## 4. Portal

- `index.html`: hero + **dua seksi (TP 1, TP 2)** + seksi prasyarat (opsional).
- Tiap kartu: ikon, nama, deskripsi, tag TP, bintang progres (localStorage),
  tombol "Mainkan →".
- Bintang: tiap game menyimpan 0–3 bintang dengan kunci
  `arena-rasional:<id>` (tidak bentrok dengan koleksi lain).

## 5. Usulan Tahap Pembangunan

1. Portal + salin Rasio Rush & Kartu Persamaan masuk.
2. 🔄 Ubah Bentuk → ⚖️ Banding Rasional (mesin mirip, efisien berurutan).
3. 🎯 Taksir Cepat → 💰 Dompet Pintar.
4. 🔍 Bedah Rasio → 🏎️ Laju Perubahan.
5. Uji + push ke repo baru (mis. `pakgun10/gezymuse-arena-rasional`) + verifikasi live.

Urutan bisa diubah sesuai prioritas Pak Gun. Estimasi repo baru terpisah agar
tidak mengganggu repo koleksi yang sudah live.
