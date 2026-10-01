# Panduan Tampilan

Acuan: `referensi/halaman-ujian-omi.png` (CBT OMI). Tema mengikuti identitas OMI 2026 dan Kemenag. Prinsip: **simpel, tegas, mudah dibaca saat ujian**. Bukan tampilan "template AI".

## Warna

Ambil sampel warna asli dari `assets/logo-omi.png` dan `assets/logo-kemenag.png`, lalu sesuaikan nilai di bawah (ini perkiraan awal).

| Token | Perkiraan | Dipakai untuk |
|---|---|---|
| `--biru` | `#1a7fc4` | warna utama: tombol utama, nomor aktif, tautan, jawaban terpilih |
| `--biru-tua` | `#125d93` | hover/tekan tombol utama |
| `--biru-muda` | `#e8f3fb` | latar jawaban terpilih, lencana |
| `--merah` | `#d3202b` | hanya: tombol "Selesaikan ujian", timer saat sisa ≤ 5 menit, galat |
| `--hijau` | `#17803d` | hanya: status benar |
| `--emas` | `#e3b505` | hanya: aksen sangat kecil di header (garis tipis) bila perlu |
| `--teks` | `#1c2733` | teks utama (bukan hitam murni) |
| `--teks-redup` | `#5b6773` | teks pendukung |
| `--garis` | `#dde3ea` | batas |
| `--latar` | `#f4f6f8` | latar halaman |
| `--putih` | `#ffffff` | permukaan |

Satu aksen kuat per layar. Merah dan hijau tidak dipakai sebagai hiasan.

## Tipografi

Satu keluarga sans-serif. Pilihan: **Plus Jakarta Sans** (Google Fonts, bobot 400/600/700) dengan cadangan `system-ui, "Segoe UI", Roboto, sans-serif`. Dasar 16 px, tinggi baris 1,55, panjang baris soal maksimal ±75 karakter. Angka timer memakai `font-variant-numeric: tabular-nums`. Judul tidak huruf kapital semua; gunakan huruf kalimat biasa.

**Teks Arab**: keluarga kedua **Noto Naskh Arabic** (Google Fonts, bobot 400/700) untuk `.ar`, cadangan `"Traditional Arabic", "Geeza Pro", serif`. Ukuran 1,25 em, tinggi baris 2, `direction: rtl`, `unicode-bidi: isolate`. Ini satu-satunya pengecualian dari aturan satu keluarga font.

## Bentuk

- Radius seragam **8 px**. Lencana dan grid nomor 6 px.
- Pembeda area memakai **garis 1 px** `--garis`, bukan bayangan. Bayangan hanya pada modal (satu lapis lembut).
- Tidak ada gradien, tidak ada efek kaca/blur, tidak ada kartu di dalam kartu.
- Ikon: sedikit, garis sederhana, hanya jika menggantikan teks yang panjang (timer, refresh, tutup). Tanpa emoji.
- Gerak: hanya respons terhadap aksi (modal muncul, toast). Timer berkedip pelan saat ≤ 5 menit. Hormati `prefers-reduced-motion`.

## Header (semua halaman)

```
[Logo Kemenag] [Logo OMI]  Try Out OMI 2026  CBT                 [Login admin]
```
Tinggi ±64 px, putih, garis bawah 1 px. Logo tinggi 40 px. Pada halaman ujian, tombol Login admin disembunyikan. Footer halaman beranda: "Dibuat oleh Genio Institute Yogyakarta".

## 1. Beranda

```
Pilih ujian
Pilih kontainer sesuai jenjang dan mata pelajaran Anda.

[Kotak "Lanjutkan ujian" jika ada sesi berjalan di perangkat ini]

MA                                   (judul kelompok jenjang)
┌───────────────────────┐ ┌───────────────────────┐
│ MA      Sesi 1        │ │ MA                    │
│ Matematika            │ │ Fisika                │
│ Try Out OMI Kab/Kota  │ │ Try Out OMI Kab/Kota  │
│ 25 soal · 120 menit   │ │ 25 soal · 120 menit   │
│            [Pilih]    │ │            [Pilih]    │
└───────────────────────┘ └───────────────────────┘
MTs
...
```
- Grid kontainer 3 kolom di laptop, 2 di tablet, 1 di HP. Kontainer = satu tombol besar (seluruh kotak bisa diklik, fokus keyboard terlihat).
- Badge jenjang kecil berwarna `--biru-muda` dengan teks `--biru-tua`.
- Keadaan kosong: "Belum ada ujian yang dibuka. Hubungi pengawas atau admin."
- Keadaan memuat: baris kerangka abu-abu sederhana, bukan spinner besar.

## 2. Popup langkah 1 dan 2

Modal lebar maks. 520 px, judul di atas, tombol di kanan bawah. Aksi utama biru di kanan; "Batal"/"Kembali" teks biasa di kiri tombol utama.

**Langkah 1** "Data peserta": Nama lengkap*, Nomor peserta, Kelas, Sekolah, Token*. Token otomatis huruf besar. Tombol "Lanjut". Galat tampil di bawah kolom token: "Token tidak cocok. Periksa kembali token dari pengawas."

**Langkah 2** "Sebelum mulai": ringkasan dua kolom (jumlah soal dengan rincian tipe, durasi), lalu daftar aturan penilaian, tata tertib, dan "Catatan dari pengawas" (disembunyikan jika kosong). Tombol "Kembali" dan **"Mulai ujian"**. Tulis dengan kalimat pendek, kata kerja aktif.

## 3. Halaman ujian (tiga kolom, lihat referensi)

```
┌ Sidebar 260px ──┬──────────── Kartu soal ───────────────┬── Panel 300px ───────┐
│ [FK] Nama        │ Soal 21 dari 25   [Pilihan ganda]     │ Sisa waktu ujian     │
│ No. peserta      │                                       │ 01:51:12             │
│ [MA Matematika]  │ (bagian 1: teks/gambar)               │ [Refresh]            │
│ [Sesi 1]         │ (bagian 2: teks/gambar)               │ [Kosongkan jawaban]  │
│                  │ (bagian 3: teks/gambar)               │ [Selesaikan ujian]   │
│ Ruang ujian      │                                       │ Daftar soal  3/25    │
│                  │ Pilih satu jawaban benar!             │ [01][02][03][04][05] │
│                  │ ( A ) opsi                            │ [06] ...             │
│                  │ ( B ) opsi                            │                      │
│                  │ [Sebelumnya]            [Berikutnya]  │                      │
└──────────────────┴───────────────────────────────────────┴──────────────────────┘
```
- Sidebar: inisial nama dalam kotak biru, nama, nomor peserta, lencana jenjang+mapel dan sesi. Boleh disederhanakan pada layar sempit.
- Kartu soal: label instruksi sesuai tipe sebagai lencana kecil. Gambar maksimal lebar kartu, `object-fit: contain`. Bila gambar gagal dimuat, tampilkan teks "Gambar tidak dapat dimuat" dengan tombol "Coba lagi".
- Opsi: baris penuh dapat diklik, huruf A, B, C... dalam kotak (pg: lingkaran; pgk: kotak, agar jelas bisa lebih dari satu). Terpilih: latar `--biru-muda`, batas `--biru`, huruf terisi biru. Isian: satu kolom teks lebar.
- Panel kanan: timer besar (≥ 28 px) dengan format `HH:MM:SS`; ≤ 5 menit berubah merah dan berkedip pelan. Tombol "Selesaikan ujian" merah penuh. "Kosongkan jawaban" meminta konfirmasi singkat.
- Grid nomor: 5 kolom, 44 px. Status: belum (putih, garis), terjawab (biru muda dengan angka biru tua), aktif (batas biru tebal 2 px). Penghitung "x/N terjawab".
- Layar sempit (< 900 px): sidebar disembunyikan; panel kanan pindah ke atas kartu (timer dan tombol ringkas) dan grid nomor menjadi laci yang dibuka tombol "Daftar soal".
- Konfirmasi selesai: modal "Kirim jawaban sekarang?" menyebut jumlah soal belum dijawab. Tombol "Kembali mengerjakan" dan "Kirim jawaban".

## 4. Hasil

Satu kolom lebar maks. 820 px, putih dengan garis. Isi urut:
1. Judul "Hasil ujian", nama ujian, jenjang, mapel, sesi, tanggal.
2. Identitas: nama, nomor peserta, kelas, sekolah.
3. Nilai besar di kanan atas blok; di bawahnya baris empat angka: **Benar**, **Salah**, **Kosong**, **Waktu pengerjaan** ("32 menit 15 detik").
4. Tabel: No, Jawaban Anda, (Kunci jika diaktifkan), Hasil. Status ditulis kata ("Benar", "Salah", "Kosong") dengan warna teks hijau/merah/abu, bukan hanya warna.
5. Di luar area cetak: tombol "Download PDF" (utama), "Cetak", "Kembali ke beranda".

PDF = isi `#hasilCetak` saja, A4 potret, margin 10 mm, header kecil logo + "Try Out OMI 2026 oleh Genio Institute Yogyakarta".

## 5. Admin

Satu halaman dengan tab teks sederhana (Ujian, Soal, Hasil) dan tombol "Keluar" di kanan. Tabel rapat, aksi per baris sebagai tombol teks. Modal lebar untuk formulir ujian dan editor soal.

**Editor soal** (modal lebar, tidak tertutup jika klik di luar):
- Baris atas: Tipe soal, Bobot.
- "Isi soal": tiga kartu bagian. Tiap kartu: pegangan seret, judul "Bagian 1/2/3", pilihan Teks / Gambar / Kosong, tombol naik dan turun. Isi teks = editor dengan toolbar: **B**, *I*, U, subskrip, superskrip, daftar, hapus format, "∑ Rumus". Isi gambar = kolom URL + tombol "Unggah" + pratinjau.
- Panel rumus (muncul di bawah toolbar): kolom LaTeX, tombol cepat (pecahan, akar, pangkat, indeks, ×, ÷, ±, ≤, ≥, ≠, ≈, π, Δ, °, panah reaksi, `\ce{}`, satuan), pilihan "baris sendiri", pratinjau langsung (KaTeX), tombol "Sisipkan". Rumus masuk ke teks sebagai `$...$`.
- "Pilihan jawaban": tiap opsi = editor mini + pilihan kunci (radio untuk pg, centang untuk pgk) + hapus. Tombol "Tambah opsi" (maks. 8). Isian: satu kolom "Jawaban benar" dengan pemisah `|`.
- Tombol "Pratinjau" menampilkan soal persis seperti yang dilihat siswa. Tombol "Simpan".
- Tempel dari Word: selalu tempel sebagai teks polos.

**Import JSON**: kotak teks + unggah berkas, tombol "Salin prompt untuk AI", pilihan mode "Tambahkan" / "Ganti semua", tombol "Periksa" (hasil: jumlah per tipe, jumlah gambar kosong, daftar galat dan peringatan per nomor, dan pratinjau rumus) lalu "Impor".

## 6. Teks (copy)

Kalimat sapaan netral, kata kerja aktif, huruf kalimat. Tombol menyebut hasilnya: "Mulai ujian", "Kirim jawaban", "Simpan soal". Satu aksi memakai satu nama di seluruh alur. Galat menyebut masalah dan cara memperbaikinya, tanpa permintaan maaf berlebihan. Contoh: "Gambar belum diisi pada soal 4, 9, dan 12."

## 7. Aksesibilitas dan responsif

Kontras teks ≥ 4,5:1. Semua kontrol bisa dicapai dengan keyboard, fokus `outline: 2px solid var(--biru)` dengan offset 2 px. Target sentuh ≥ 44 px. Status tidak hanya dengan warna. Uji lebar 360 px, 768 px, dan 1366 px.

## 8. Dilarang (ulang)

Gradien. Efek kaca/blur. Bayangan tebal di banyak elemen. Kartu dalam kartu. Emoji. Label huruf kapital semua. Tanda "→" di tombol. Animasi masuk di tiap bagian. Hiasan angka "01/02/03" selain nomor soal yang memang berurutan. Kata pemasaran di antarmuka.
