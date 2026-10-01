# Panduan Tampilan

Acuan: `referensi/halaman-ujian-omi.png` (CBT OMI). Tema mengikuti identitas OMI 2026 dan Genio Institute. Prinsip: **simpel, tegas, mudah dibaca saat ujian**. Bukan tampilan "template AI".

## Warna

Ambil sampel warna asli dari `assets/logo-omi.png` dan `assets/logo-genio.png`, lalu sesuaikan nilai di bawah (ini perkiraan awal; `--biru` sudah digelapkan sedikit dari logo agar teks putih di atasnya memenuhi kontras 4,5:1).

| Token | Perkiraan | Dipakai untuk |
|---|---|---|
| `--biru` | `#1879bd` | warna utama: tombol utama, nomor aktif, tautan, jawaban terpilih |
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

Satu keluarga sans-serif. Pilihan: **Plus Jakarta Sans** (Google Fonts, bobot 400/600/700) dengan cadangan `system-ui, "Segoe UI", Roboto, sans-serif`. Dasar **14 px** di seluruh situs (`html { font-size: 14px }`; semua ukuran dalam `rem` ikut), kecuali kolom isian di perangkat sentuh yang 16 px agar iOS tidak memperbesar halaman saat kolom difokuskan, tinggi baris 1,55, panjang baris soal maksimal ±75 karakter. Angka timer memakai `font-variant-numeric: tabular-nums`. Judul tidak huruf kapital semua; gunakan huruf kalimat biasa.

**Teks Arab**: keluarga kedua **Noto Naskh Arabic** (Google Fonts, bobot 400/700) untuk `.ar`, cadangan `"Traditional Arabic", "Geeza Pro", serif`. Ukuran 1,25 em, tinggi baris 2, `direction: rtl`, `unicode-bidi: isolate`. Ini satu-satunya pengecualian dari aturan satu keluarga font.

## Bentuk

- Radius seragam **8 px**. Lencana dan grid nomor 6 px.
- Pembeda area memakai **garis 1 px** `--garis`, bukan bayangan. Bayangan hanya pada modal (satu lapis lembut).
- Tidak ada gradien, tidak ada efek kaca/blur, tidak ada kartu di dalam kartu.
- Ikon: sedikit, garis sederhana, hanya jika menggantikan teks yang panjang (timer, refresh, tutup). Tanpa emoji.
- Gerak: hanya respons terhadap aksi (modal muncul, toast). Timer berkedip pelan saat ≤ 5 menit. Hormati `prefers-reduced-motion`.

## Header (semua halaman)

```
[Logo Genio] [Logo OMI]  Try Out OMI 2026 / CBT                 [Login admin]
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

**Desain beranda terbaru (selaras redesign admin, hijau lembut)**. Berlaku di `body[data-halaman="beranda"]` (token warna hijau `--biru: #1f8a4c`, `--latar: #f3f7f3`, radius kartu 16 px):
1. Header putih datar (tidak melayang, tanpa blur) dengan menu Beranda / Pilih ujian / Tentang OMI / Jadwal dan penilaian yang menggulir ke bagian terkait (disembunyikan di bawah 960 px).
2. Hero berfoto: foto dibaca dari `hero.jpg` di bucket Storage `aset` (sama dengan logo OMI); bila berkas tidak ada, tampil hijau polos. Lapisan hijau tua rata (bukan gradien) menutup foto agar teks terbaca. Kuning hanya titik kecil di label "Try Out OMI 2026".
3. Kartu tiga langkah (Pilih ujian, Isi data dan token, Kerjakan dan lihat hasil) menempel di perbatasan hero.
4. Pilih ujian: filter jenjang berbentuk segmen; kartu paket berisi ikon mapel, nama, jenjang, mapel, sesi, chip jumlah soal per tipe, durasi, dan "Mulai ujian".
5. Di bawah Pilih ujian hanya tiga bagian: Apa itu OMI, Bentuk tes dan jadwal, dan Penilaian (kartu putih bergaris tipis). Kartu jenjang, daftar yang disiapkan, dan larangan sudah dihapus.
6. Footer: kotak putih berisi logo dan catatan simulasi, dengan aksen kuning kecil di tepi atas dan garis bawah tautan resmi.
Info "120 menit" tidak lagi tampil di hero.

## 2. Popup langkah 1 dan 2

Modal lebar maks. 520 px, judul di atas, tombol di kanan bawah. Aksi utama biru di kanan; "Batal"/"Kembali" teks biasa di kiri tombol utama.

**Langkah 1** "Data peserta": Nama lengkap*, Nomor peserta, Kelas, Sekolah, Token*. Token otomatis huruf besar. Tombol "Lanjut". Galat tampil di bawah kolom token: "Token tidak cocok. Periksa kembali token dari pengawas."

**Langkah 2** "Sebelum mulai": ringkasan dua kolom (jumlah soal dengan rincian tipe, durasi), lalu daftar aturan penilaian, tata tertib, dan "Catatan dari pengawas" (disembunyikan jika kosong). Tombol "Kembali" dan **"Mulai ujian"**. Tulis dengan kalimat pendek, kata kerja aktif.

**Popup dan login (gaya selaras admin)**: header popup memakai ubin ikon hijau muda + judul + sub-judul (`openModal` menerima `ikon` dan `sub`). Data peserta: ringkasan paket di panel hijau sangat muda, kolom bergaris tipis, kolom token huruf besar berjarak, catatan bantu di bawah. Sebelum mulai: tiga ubin (jumlah soal dan rincian tipe, durasi, peserta), catatan pengawas bergaris kuning, dua kartu bernomor (aturan penilaian dan tata tertib). Login admin: popover dengan ikon gembok, kolom sandi berikon, tombol Masuk selebar kotak. Footer tombol popup selalu tampak, hanya badan yang menggulir.

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

**Pembaruan layar ujian (mengikuti foto CBT OMI asli)**: kepala kartu soal tetap (tidak ikut animasi pindah soal) berisi lencana nomor biru "Soal n", chip "Status: x dari N Soal" (jumlah terjawab) dan chip tipe, lalu di kanan tombol **A-** dan **A+** (5 tingkat ukuran huruf soal dan opsi: 0,88 / 1 / 1,14 / 1,3 / 1,5 kali; disimpan di `localStorage` kunci `cbt_huruf_v1` dengan `try/catch`) dan panah kecil soal sebelumnya/selanjutnya (disembunyikan di HP karena bilah bawah sudah ada). Tombol bawah bertuliskan "Sebelumnya" dan "Selanjutnya". Di layar > 900 px header situs disembunyikan; logo OMI dan Genio pindah ke atas sidebar kiri. Kode soal tidak dibuat. Skala sudut layar ujian: kartu dan panel 12 px, kotak dan tombol 8 px, huruf opsi 6 px; bulat penuh hanya untuk pil, chip, dan tombol Sebelumnya/Selanjutnya. Kotak nomor di Daftar Soal selalu persegi (`aspect-ratio: 1`), 5 kolom di desktop dan 6 di HP. Tanpa bayangan berwarna (glow).

## 4. Hasil

Satu kolom lebar maks. 860 px, putih dengan garis (rapor ringkas). Isi urut:
0. Banner hijau "Jawaban Anda sudah terkirim dan dinilai." (tidak ikut cetak/PDF).
1. Judul "Hasil ujian", nama ujian, jenjang, mapel, sesi, tanggal.
2. Identitas: nama, nomor peserta, kelas, sekolah.
3. Nilai besar ditulis per maksimum, mis. **84/100** ("/100" lebih kecil), di kanan atas blok; di bawahnya baris empat angka: **Benar**, **Salah**, **Kosong**, **Waktu pengerjaan** ("32 menit 15 detik").
4. Tabel: No, Jawaban Anda, (Kunci jika diaktifkan), Hasil. Status ditulis kata ("Benar", "Salah", "Kosong") dengan warna teks hijau/merah/abu, bukan hanya warna.
5. Di luar area cetak: tombol "Download PDF" (utama), "Cetak", "Kembali ke beranda".

PDF dibuat dari dokumen terpisah (`bangunPdf`), bukan salinan layar: A4 potret satu halaman, margin 10 mm, kop logo + "Laporan Hasil Try Out OMI 2026" (garis biru), kotak nilai "84/100", baris empat angka, tabel No/Jawaban Anda/Hasil dalam dua kolom, tanpa kolom kunci, catatan kaki "Dokumen ini dibuat otomatis oleh sistem Try Out OMI 2026." Cetak (`window.print`) memakai tampilan layar tanpa banner.

## 5. Admin

Sidebar kiri (188 px) berisi logo, menu Ujian / Soal / Hasil dengan jumlahnya, lalu "Lihat beranda" dan "Keluar" di bawah. Header situs disembunyikan di panel admin. Ukuran dasar font panel 13 px (kelas `adm-aktif` pada `<html>`) agar banyak data muat di layar. Di bawah 860 px sidebar menjadi bilah atas dan baris tabel menjadi kartu ringkas.

**Tema admin**: hijau lembut (`html.adm-aktif` menimpa token: aksen #1f8a4c, latar #f3f7f3, radius 10 dan 16 px). **Dropdown dan tanggal** tidak memakai `<select>` atau `datetime-local` bawaan perangkat; gunakan `window.dropdown({pilihan, nilai, bebas?})` dan `window.pilihWaktu({nilai})` dari `JsCommon.html`. Keduanya punya properti `value` dan memicu event `change`, bisa dipakai seperti elemen form biasa; `pilihWaktu` mengembalikan format `YYYY-MM-DDTHH:mm` (jam perangkat). Panel muncul sebagai `position: fixed`, ditutup dengan klik di luar, Esc, atau gulir; dropdown bisa dioperasikan dengan panah atas/bawah dan Enter.

**Gerak panel admin**: penanda hijau di menu samping dan penanda gelap di saringan (Semua/Aktif/...) bergeser mulus ke pilihan baru; isi panel meluncur dari arah tab yang dipilih; baris tabel muncul bertahap; saat data dimuat (ganti ujian, buka tab) tampil tabel kosong berdenyut dengan kolom yang sama. Popup dropdown dan kalender dijaga tetap di dalam layar (turun, naik, atau digeser bila tidak muat). Semua gerak mati bila perangkat meminta `prefers-reduced-motion`.

**Pemilih paket soal** (tab Soal dan Hasil) memakai `window.pilihCari`: kolom cari yang menampilkan paket terpilih; saat diklik kolom dikosongkan agar langsung diketik dan daftar muncul otomatis di bawahnya (nama, jenjang, mapel, sesi, jumlah soal, status; huruf yang cocok disorot; pesan "Tidak ada paket yang cocok" bila kosong). Panah atas/bawah, Enter, dan Esc bekerja; klik di luar mengembalikan tampilan ke paket terpilih.

**Kontrol seragam**: semua tombol, dropdown, kolom cari, dan saringan di panel admin memakai tinggi yang sama (`--tk`: 30 px, 34 px di layar sentuh) tanpa ruang kosong atas-bawah. Checkbox dan radio memakai tampilan hijau buatan sendiri (bukan bawaan perangkat); spinner angka dan tombol hapus kolom cari dimatikan; unggah berkas memakai tombol, bukan input bawaan.

**Tab Ujian**: judul + ringkasan jumlah per status, tombol "Tambah ujian"; alat: saring status (Semua, Aktif, Terjadwal, Nonaktif, Ditutup), saring jenjang, urutan, dan pencarian nama/mapel/token. Tabel rapat (tinggi baris 42 px): ujian (nama, mapel, sesi, tanda merah "n gambar kosong"), jenjang, soal (jumlah dan PG/PGK/isian), durasi, token (klik untuk menyalin), jadwal, selesai (+n sedang mengerjakan), status, dan tiga ikon aksi (Ubah, Duplikat, Hapus). Data `n_gambar_kosong`, `n_selesai`, `n_berjalan` berasal dari view `ujian_ringkas`; bila view belum diperbarui kolomnya kosong dan tampil "-".
Popup: Tambah/Ubah ujian (satu formulir, lebar 600 px, bagian Identitas, Pengerjaan, Jadwal, Pengaturan, Catatan), Duplikat (nama salinan dapat diubah), Hapus (peringatan merah menyebut jumlah soal dan hasil yang ikut terhapus).

**Tab Soal**: judul dengan ringkasan (jumlah soal dan total bobot), tombol "Import JSON" dan "Tambah soal"; alat: dropdown ujian, saring tipe (Semua, PG, PGK, Isian, Gambar kosong) dan pencarian isi soal. Spanduk kuning menyebut nomor soal bergambar kosong. Tabel rapat (baris 38 px): nomor, tipe, isi soal satu baris (rumus dan Arab tampil), opsi, kunci, bobot, penanda gambar kosong, dan ikon aksi: naikkan, turunkan, **lihat (ikon mata, membuka tampilan siswa dengan kunci ditandai)**, ubah, hapus. Panah naik/turun nonaktif saat saringan dipakai.

**Tab Hasil**: judul dengan jumlah peserta selesai, tombol "Muat ulang" dan "Ekspor CSV"; alat: dropdown ujian, saring sekolah dan kelas (dari data hasil), dan pencarian nama/sekolah/nomor. Baris ringkasan (dihitung di browser dari hasil yang sedang tampil): rata-rata nilai, tertinggi, terendah, rata-rata waktu, rata-rata benar, dan sebaran nilai per 20 poin. Tabel padat: peringkat (1 sampai 3 diwarnai; peringkat dihitung dari seluruh peserta walau disaring), nama + nomor peserta, kelas, sekolah, benar/salah/kosong, nilai dengan garis kecil, waktu, selesai, ikon mata (rincian) dan ikon sampah (hapus hasil). Rincian peserta: peringkat, nilai, benar, salah, kosong, waktu; kotak per soal berwarna (hijau benar, merah salah, abu kosong, garis putus-putus bila soal disembunyikan); daftar soal salah/kosong dengan jawaban siswa dan kunci. Tombol "Hapus hasil" ada di kiri bawah.

**Editor soal (tata letak dua kolom)**: modal lebar 1060 px. Kiri: tipe soal, bobot, ringkasan kunci, lalu kartu bagian (nomor, pilihan Teks/Gambar, ikon naik, turun, dan sampah untuk menghapus bagian; kartu yang sedang diedit mendapat toolbar, kartu lain hanya menampilkan isinya) dan pilihan jawaban dua kolom (huruf, editor, tombol kunci, sampah). Kanan: pratinjau siswa yang diperbarui langsung (jawaban kunci ditandai) dan ringkasan status. Menghapus bagian menampilkan toast "Urungkan". Tombol Batal/Pratinjau/Simpan selalu di dasar jendela. Di bawah 860 px kolom pratinjau disembunyikan. Rincian lama di bawah ini masih berlaku untuk isi toolbar dan panel rumus.

**Editor soal** (modal lebar, tidak tertutup jika klik di luar):
- Toolbar teks hanya memakai simbol dan ikon (B, I, U, x2, x2, ikon rata kiri/tengah/kanan/kiri-kanan, daftar poin, daftar nomor, hapus format, ∑), dikelompokkan dengan pemisah tipis; tombol naik/turun/hapus bagian dan hapus opsi juga ikon.
- Baris atas: Tipe soal, Bobot.
- "Isi soal": tiga kartu bagian. Tiap kartu: pegangan seret, judul "Bagian 1/2/3", pilihan Teks / Gambar / Kosong, tombol naik dan turun. Isi teks = editor dengan toolbar: **B**, *I*, U, subskrip, superskrip, rata kiri/tengah/kanan/kiri-kanan (berlaku pada teks yang diblok atau baris tempat kursor berada; tombol perataan yang aktif disorot), daftar, hapus format, "∑ Rumus". Editor mini untuk opsi jawaban tidak punya tombol perataan. Isi gambar = kolom URL + tombol "Unggah" + pratinjau.
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

## 9. Halaman ujian meniru CBT OMI (pengecualian yang disengaja)

Tujuan situs adalah simulasi, jadi **halaman ujian** (dan kartu soal pada pratinjau admin) meniru tampilan CBT OMI asli (`referensi/halaman-ujian-omi.png`). Halaman lain (beranda, hasil, admin) tetap mengikuti aturan minimalis di atas. Pengecualian di halaman ujian:

- **Header tetap putih** seperti halaman lain. **Latar polos** (`--latar`), tanpa gradien. Avatar peserta boleh bergradien halus.
- **Permukaan kaca**: putih tembus pandang (`--kaca`), tepi putih 1 px, sudut besar 22 px, bayangan lembut bernuansa biru (`--bayangan-lembut`, `--bayangan-angkat`). Tanpa `backdrop-filter` (latar halus membuat blur tidak terlihat, dan hemat untuk Chromebook). Bayangan hitam pekat tetap dilarang.
- **Label Title Case** seperti aslinya: Sisa Waktu Ujian, Kosongkan Jawaban, Selesaikan Ujian, Daftar Soal, Terjawab, Ruang Ujian, Pusat Bantuan. Nama peserta ditulis kapital.
- **Ikon garis tipis** (SVG, `ikon()` di `JsCommon.html`) yang selalu disertai teks: jam, segarkan, silang, henti, buku, bantuan, panah, daftar, centang.
- **Tata letak** tiga kolom: sidebar peserta dengan identitas (avatar, nama, nomor, mapel, sesi) di dalam kontainer samar, lalu menu ( Ruang Ujian dan Pusat Bantuan di bawah), kartu soal dengan garis kemajuan tipis. Opsi punya penanda di kanan: lingkaran berisi titik (pg) atau kotak berisi ceklis putih di atas biru (pgk) di tepi atas, dan panel kanan (timer biru besar, Refresh, Kosongkan Jawaban, Selesaikan Ujian merah, Daftar Soal dengan penghitung Terjawab dan grid nomor).
- **HP (< 900 px)**: sidebar hilang. Panel menjadi bilah atas yang menempel (timer dan tombol Daftar Soal). Daftar Soal, Refresh, Kosongkan Jawaban, dan Selesaikan Ujian berada di laci geser dari bawah (ditutup dengan tombol Escape, ketuk latar, atau memilih nomor). Tombol Sebelumnya dan Berikutnya menempel di bawah layar dengan penunjuk posisi dan area aman perangkat.

**Gerak** (hanya `transform` dan `opacity`, kurva pegas `--ease-pegas` = `cubic-bezier(.32,.72,0,1)`):
- panel masuk bertahap saat ujian dimulai;
- soal bergeser masuk dari kanan (maju) atau kiri (mundur), opsi masuk berurutan;
- opsi terangkat saat disorot, mengecil sedikit saat ditekan, huruf terisi dan tanda centang muncul saat dipilih;
- nomor di grid terangkat saat disorot dan memantul sekali saat baru terjawab;
- garis kemajuan memanjang sesuai jumlah terjawab;
- timer merah berdenyut pelan saat sisa ≤ 5 menit; modal dan toast muncul halus; tombol mengecil sedikit saat ditekan.
- `prefers-reduced-motion` mematikan semua animasi. Jangan menaruh `animation-fill-mode: both` pada induk elemen `position: fixed` (laci, bilah bawah): sisa `transform` akan membuat elemen itu menempel ke induknya.
