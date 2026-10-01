# TASKS

Kerjakan berurutan, satu milestone per sesi. Centang saat uji manual lulus. Rujukan: `CLAUDE.md`, `docs/PRD.md`, `docs/API.md`.

## M0. Persiapan (dikerjakan pemilik, bukan Claude Code)

- [ ] Buat project Supabase. Jalankan `supabase/schema.sql` di SQL Editor.
- [ ] Unggah `assets/logo-omi.png` ke bucket `aset` (logo Genio sudah tertanam di `Index.html`) (dashboard Supabase > Storage). Catat URL publiknya.
- [ ] Buat project Apps Script (atau `clasp create`). Isi Script Properties: `SUPABASE_URL`, `SUPABASE_KEY` (service_role), `ADMIN_PASSWORD`.
- [ ] `clasp login`, salin `.clasp.json.example` menjadi `.clasp.json`, isi `scriptId`.

## M1. Fondasi server

Berkas: `src/Code.gs`, `src/Util.gs`, `src/Nilai.gs`, `src/Index.html` (kerangka kosong), `src/Css.html`, `src/JsCommon.html`.
- [x] `doGet`, `include`, `sb_`, `enc_`, `guard_`, `shuffle_`, `seedShuffle_`.
- [x] `Nilai.gs`: `norm_`, `cek_`, `hitung_`, `normSoal_` sesuai `API.md` dan `FORMAT-SOAL.md`.
- [x] Token CSS (variabel warna, tipografi) dari `UI.md`; header dengan logo; helper klien (`call`, `toast`, `openModal`, `clean`, `blokHTML`, `mathify`, `showView`).

Uji: halaman terbuka dengan header; fungsi uji sementara memanggil `sb_('GET','ujian?select=id&limit=1')` tanpa galat; contoh pemanggilan `hitung_` dengan data tiruan menghasilkan benar/salah/kosong yang tepat (cek pg, pgk, isian koma-titik, kosong).

Status uji: lulus (logika Node, helper browser, dan `sb_`/`hitung_` di Apps Script asli). Fungsi `uji*` sudah dihapus.

## M2. Admin: ujian

Berkas: `src/ApiAdmin.gs` (login, ujian), `src/JsAdmin.html`.
- [x] `adminLogin`, token di `CacheService`, tombol Login admin di header, popover kecil berisi kolom kata sandi.
- [x] `adminUjianList/Simpan/Hapus`; tab Ujian dengan tabel dan formulir (token acak, catatan, sesi, semua pengaturan).
- [x] Hapus cache beranda saat simpan.

Uji: salah sandi ditolak; buat 3 ujian (MI/MTs/MA); ubah; hapus meminta konfirmasi; token sesi kedaluwarsa mengembalikan ke beranda dengan pesan.

Status uji: validasi `normUjian_` lulus uji Node; alur login, tambah, ubah, hapus, dan Keluar lulus uji browser dengan server tiruan. Belum dicentang: uji di Apps Script asli (salah sandi, 3 ujian MI/MTs/MA, token kedaluwarsa kembali ke beranda).

## M3. Admin: soal (manual)

Berkas: `src/JsEditor.html`, bagian soal di `ApiAdmin.gs` dan `JsAdmin.html`.
- [x] Editor teks kaya + panel rumus (KaTeX, pratinjau langsung, tombol cepat, mhchem), tempel sebagai teks polos.
- [x] Editor bagian (awal 3, bisa tambah sampai 8): pilih Teks/Gambar/Kosong, tombol naik/turun (seret belum ada).
- [x] Editor opsi (A sampai H) dengan editor mini, kunci radio/centang, isian dengan pemisah `|`.
- [x] `adminUpload` + kompres gambar di browser.
- [x] `adminSoalList/Simpan/Hapus/Urut`; daftar soal dengan pratinjau rumus dan tanda "gambar belum diisi".
- [x] Pratinjau persis tampilan siswa.
- [x] Dukungan Arab: `normArab_` (NFKC bentuk presentasi, buang kendali arah) dipakai saat tempel dan simpan; `blokHTML` membungkus rangkaian Arab dengan `span.ar[dir=rtl]`; font Noto Naskh Arabic.

Uji: buat satu soal tiap tipe dengan rumus `\frac`, `\sqrt`, `\ce{}`, tebal/miring/garis bawah di soal **dan** opsi; gambar di atas, di tengah, di bawah; geser posisi; unggah gambar dan muncul; simpan, buka ulang, isi tetap sama; kunci tidak lengkap ditolak dengan pesan jelas; tempel kalimat Arab berharakat (mis. ayat dan kalimat campur Arab-Indonesia) di soal dan di opsi: harakat utuh, huruf menyambung, arah benar, tersimpan dan terbuka ulang sama persis.

Status uji: logika server lulus uji Node; alur editor (tempel Arab berharakat, rumus, opsi, kunci, pratinjau, simpan, ubah, urut, hapus, penanda gambar kosong) lulus uji browser dengan server tiruan. Uji di Apps Script asli: lulus.

## M4. Import JSON

- [x] `adminSoalImport` (dry run, tambah, ganti) dengan peringatan LaTeX tanpa garis miring.
- [x] Modal import: tempel/unggah, salin prompt AI (`String.raw`), periksa, pratinjau rumus, impor.

Uji: impor `contoh/soal-contoh.json` (6 soal; satu gambar kosong terdeteksi); JSON yang rusak memberi pesan baris/posisi; "sqrt17" tanpa `\` memicu peringatan; mode ganti meminta konfirmasi; JSON berisi teks Arab berharakat tampil benar di pratinjau.

Status uji: `ringkasImport_` lulus uji Node dengan `contoh/soal-contoh.json` (6 soal, gambar kosong di soal 2); modal import lulus uji browser (JSON rusak memberi baris dan kolom, sqrt tanpa backslash memberi peringatan, pagar kode dibuang, mode ganti meminta konfirmasi). Belum dicentang: uji di Apps Script asli.

## M5. Beranda, token, info sebelum mulai

Berkas: `src/ApiSiswa.gs`, `src/JsSiswa.html`.
- [x] `apiBeranda` (view `ujian_ringkas`, cache 60 detik, tanpa token, hanya aktif), kontainer dikelompokkan per jenjang.
- [x] `apiCekToken`; popup langkah 1 (data peserta + token) dan langkah 2 (info sebelum mulai, catatan khusus tersembunyi jika kosong).
- [x] Kotak "Lanjutkan ujian" bila ada sesi di `localStorage`.

Uji: ujian nonaktif tidak tampil; token salah menampilkan pesan di kolom token; langkah 2 menampilkan jumlah soal dan rincian tipe yang benar; tombol Kembali mempertahankan isian.

Catatan: kotak "Lanjutkan ujian" membaca `localStorage` kunci `cbt_sesi_v1` ({sesiId, ujianId, ujianNama, akhirMs, offset, token, peserta}); isinya baru ditulis di M6, jadi kotak ini baru muncul setelah M6. Tombol "Mulai ujian" memanggil `App.mulaiUjian` yang diisi di M6.

Status uji: urutan kontainer, pencocokan token lulus uji Node; beranda, popup, tombol Kembali, galat token, catatan khusus, layar 360 px lulus uji browser dengan server tiruan. Belum dicentang: uji di Apps Script asli.

## M6. Halaman ujian

- [x] `apiMulai` (buat sesi, atau lanjutkan sesi berjalan yang sama), `apiSinkron`.
- [x] Layout tiga kolom sesuai `UI.md` dan referensi; label instruksi per tipe; opsi pg/pgk/isian; grid nomor dan penghitung terjawab; Sebelumnya/Berikutnya; Kosongkan jawaban; Refresh (sinkron jam dan simpan jawaban).
- [x] Timer dari `akhirMs` + `offset`; ≤ 5 menit merah; habis = kirim otomatis.
- [x] Simpan lokal tiap perubahan; sinkron server tiap 3 menit; peringatan sebelum menutup halaman.
- [x] Responsif (< 900 px): sidebar disembunyikan, laci daftar soal.

Uji: refresh browser di tengah ujian lalu lanjut tanpa kehilangan jawaban dan waktu tidak reset; ubah jam perangkat tidak mengubah timer; acak soal/opsi konsisten saat dilanjutkan; kunci tidak terlihat di Network/respon; uji di layar 360 px; soal Arab tampil rata kanan dengan font Naskh dan jawaban isian Arab tersimpan utuh.

Catatan: soal dengan bagian gambar kosong tidak ditampilkan dan tidak dinilai (total = soal yang tampil). `apiSinkron` hanya dipanggil bila ada perubahan (hemat UrlFetch); tombol Refresh selalu menyinkron. Halaman hasil di M6 masih versi sementara (angka saja); M7 menggantinya.

Status uji: logika server (lanjut sesi, acak konsisten, kunci tidak bocor, idempoten, durasi dibatasi, sesi lewat waktu) lulus uji Node dengan Supabase tiruan; halaman ujian (pg, pgk, isian Arab, grid, kosongkan, simpan lokal, sinkron, laci 360 px, kirim gagal lalu kirim ulang, lanjut setelah reload, kirim otomatis saat waktu habis) lulus uji browser. Belum dicentang: uji di Apps Script asli (termasuk ubah jam perangkat, kunci tidak terlihat di Network).

## M7. Hasil dan PDF

- [x] `apiSelesai` (penilaian server, idempoten), modal konfirmasi selesai dengan jumlah belum dijawab, tombol kirim ulang saat gagal.
- [x] Halaman hasil: identitas, nilai, benar, salah, kosong, waktu pengerjaan, tabel per nomor, kunci hanya jika `tampil_kunci`.
- [x] Unduh PDF (html2pdf.js, `useCORS`), Cetak (`@media print`), Kembali ke beranda.

Uji: kombinasi jawaban pg/pgk/isian menghasilkan benar/salah/kosong yang tepat dan `benar+salah+kosong = total`; waktu habis mengirim otomatis; PDF terunduh di Chrome desktop, Chrome Android, Safari iOS, dan gambar, rumus, dan teks Arab ikut tampil benar (tidak terbalik/terputus); kunci muncul hanya jika diaktifkan.

Keputusan: PDF dan cetak tidak memuat kolom kunci. Di layar, kunci hanya untuk pg dan pgk (huruf abjad sesuai tampilan siswa, jadi ikut berubah bila opsi diacak) dan hanya jika `tampil_kunci` aktif; kunci isian tidak pernah dikirim ke klien. Jawaban isian dianggap bukan Arab, jadi hasil dan PDF tidak menangani teks Arab.

Status uji: server lulus uji Node (kunci isian null, pg/pgk hanya bila tampil_kunci); hasil lulus uji browser (angka, tabel, pemetaan huruf kunci, PDF terunduh bernama `Hasil_<Nama>_<Ujian>.pdf` tanpa kunci, cetak menyembunyikan kunci dan tombol, 360 px). Belum dicentang: uji di Apps Script asli di Chrome desktop, Chrome Android, dan Safari iOS.

Perbaruan desain hasil (opsi 1, rapor ringkas): nilai ditulis per maksimum (84/100), banner selesai, PDF satu halaman dua kolom dari dokumen terpisah `bangunPdf`. Lulus uji Node dan uji browser (layar 1100 px, 390 px, dokumen PDF); unduhan PDF asli belum diuji di Apps Script.

Perbaruan desain beranda (opsi 2, header datar): hero berfoto `hero.jpg` (opsional), langkah, kartu paket dengan ikon mapel, bagian OMI berupa kartu, footer putih beraksen kuning, menu header menggulir. Lulus uji Node dan uji browser (1280 px, 390 px).

Perbaruan tabel di soal: tombol tabel di toolbar editor (baris, kolom, baris judul; tambah/hapus baris dan kolom, hapus tabel, Tab antar sel, tempel dari Word/Excel menjadi tabel), tag `table/thead/tbody/tr/th/td` plus atribut `colspan/rowspan` (2 sampai 12) masuk whitelist DOMPurify, gaya tabel di editor/pratinjau/siswa, dan prompt AI (rule 10 dan 13) diperbarui agar tabel di dokumen diimpor sebagai tabel HTML. Lulus uji Node dan uji browser; belum diuji di Apps Script asli.

## M8. Admin: hasil

- [x] `adminHasil` dengan urutan skor, benar, salah (sedikit), waktu (cepat); tab Hasil; ekspor CSV; `adminSesiHapus`.

Uji: dua siswa berskor sama terurut sesuai aturan seri.

Catatan: siswa yang seri pada nilai, benar, salah, dan waktu berbagi nomor peringkat. CSV memakai pemisah titik koma, koma desimal, dan BOM supaya terbuka rapi di Excel berbahasa Indonesia; sel yang diawali `=`, `+`, `-`, `@` diberi apostrof agar tidak dijalankan sebagai rumus.

Status uji: urutan hasil dan hapus lulus uji Node; tabel, peringkat seri, ekspor CSV, hapus, keadaan kosong, 360 px lulus uji browser. Belum dicentang: uji di Apps Script asli.

## M9. Uji beban dan perapian

- [x] Panduan uji beban dan hitungan UrlFetch di `docs/UJI-BEBAN.md` (uji dengan perangkat nyata dilakukan pemilik).
- [x] Periksa semua teks galat, keadaan kosong, fokus keyboard, kontras, dan daftar "Dilarang" di `UI.md`.
- [x] Tulis petunjuk singkat untuk admin di `README.md`.

Hasil perapian: kontras `--biru` diperbaiki (4,31 menjadi 4,66 dengan teks putih); target sentuh 44 px di perangkat sentuh; pesan ramah untuk galat kuota dan koneksi; `adminKeluar` kini memakai `guard_`; uji Node dan pemeriksaan statis aturan CLAUDE.md ada di `tests/` (`node tests/jalankan.js`). Belum dicentang: uji beban di perangkat nyata.

## Opsional di akhir Tahap 1

- [x] Jadwal buka/tutup otomatis (`buka_at`, `tutup_at`): ujian tampil di beranda hanya di antara keduanya; token ditolak dengan pesan "belum dibuka" atau "sudah ditutup". Siswa yang sudah mulai tetap boleh melanjutkan dan menyelesaikan ujian setelah waktu tutup.
- [x] `adminUjianDuplikat`: menyalin ujian dan soal; salinan nonaktif, token baru, tanpa jadwal.
- [x] Tombol "Reset" per hasil agar siswa bisa mengulang (memakai `adminSesiHapus`).

Status uji: logika jadwal, duplikat, dan batas tutup lulus uji Node (`node tests/jalankan.js`); formulir, status tabel, duplikat, dan Reset lulus uji browser. Belum dicentang: uji di Apps Script asli.

## Penyempurnaan tampilan halaman ujian (meniru CBT OMI asli)

- [x] Latar pastel, permukaan kaca, bayangan lembut, ikon garis, label Title Case, avatar peserta, menu Ruang Ujian dan Pusat Bantuan (modal bantuan), garis kemajuan di kartu soal.
- [x] Animasi: panel masuk bertahap, soal bergeser maju/mundur, opsi masuk berurutan dan bereaksi saat disorot, ditekan, dan dipilih, nomor memantul saat baru terjawab, timer berdenyut saat sisa waktu ≤ 5 menit, modal dan toast halus. Mati otomatis bila perangkat meminta `prefers-reduced-motion`.
- [x] HP: bilah atas menempel (timer dan Daftar Soal), laci geser dari bawah untuk Daftar Soal dan tombol aksi, tombol Sebelumnya/Berikutnya menempel di bawah dengan area aman perangkat, tanpa scroll ke samping di 390 px.
- [x] `docs/UI.md` bagian 9 dan `CLAUDE.md` memuat pengecualian ini; `tests/statis.test.js` membatasi gradien, bayangan, kapital, dan blur.

- [x] Logo Genio menggantikan logo Kemenag di header dan kop hasil/PDF (tertanam sebagai data URI, tanpa unggahan). Latar halaman ujian polos. Skala seluruh situs dikecilkan (dasar 14 px; target sentuh tetap 44 px dan kolom isian 16 px di perangkat sentuh).

Status uji: alur lengkap (jawab pg/pgk/isian, pindah soal, kosongkan, bantuan, Refresh, selesai, laci HP, Escape, ketuk latar, tombol bawah) lulus uji browser desktop 1440 px dan HP 390 px. Belum dicentang: pemeriksaan di perangkat sungguhan (iPad Safari, Chrome Android, Chromebook) dan kecepatan animasi di laptop sekolah.

## Tahap 2 (belum)

Pembahasan soal, analisis per soal, skor parsial pgk, ganti sandi admin dari web, soal esai, deteksi pindah tab, webcam/mikrofon, optimasi kuota (cache soal, tulis langsung ke Supabase).

## Performa dan beranda baru

- [x] Daftar ujian ikut tertanam di halaman (`window.AWAL`) sehingga tampil seketika, lalu disegarkan di belakang layar. Cache server: daftar beranda 300 detik, soal per versi (`ver_soal`), durasi 600 detik.
- [x] Server menggabungkan panggilan Supabase (`fetchAll`, relasi `sesi` + `ujian`); `apiMulai` dan `apiSelesai` memakai cache soal.
- [x] Animasi muat: bilah atas, layar muat bermerek (`muatan`), putaran pada tombol (`sibuk`), kerangka kartu.
- [x] Panel admin menampilkan daftar terakhir lebih dulu lalu menyegarkannya; hapus ujian langsung hilang dari daftar. Durasi bawaan ujian baru 120 menit.
- [x] Beranda profesional: hero, "Apa itu OMI?", format tes dan jadwal, penilaian, tata tertib (dari Petunjuk Teknis OMI 2026), durasi 120 menit untuk semua jenjang.
- [x] html2pdf dimuat saat dibutuhkan (`pastikanPdf`).

## Redesign admin (tahap 1: kerangka dan tab Ujian)

- [x] Sidebar kiri, font dasar 13 px, tabel ujian padat dengan saringan status/jenjang, urutan, pencarian, dan salin token.
- [x] Popup Tambah/Ubah, Duplikat (nama salinan), dan Hapus (menyebut jumlah soal dan hasil).
- [x] View `ujian_ringkas` menambah `n_gambar_kosong`, `n_selesai`, `n_berjalan` (jalankan ulang `supabase/schema.sql`; tanpa itu kolomnya tampil "-").
- [ ] Tahap 2: tab Soal dan Hasil dengan bahasa visual yang sama.
- [x] Tema A2 (hijau lembut) diterapkan ke seluruh panel admin; dropdown dan pemilih tanggal/jam buatan sendiri menggantikan select dan datetime-local.
