# TASKS

Kerjakan berurutan, satu milestone per sesi. Centang saat uji manual lulus. Rujukan: `CLAUDE.md`, `docs/PRD.md`, `docs/API.md`.

## M0. Persiapan (dikerjakan pemilik, bukan Claude Code)

- [ ] Buat project Supabase. Jalankan `supabase/schema.sql` di SQL Editor.
- [ ] Unggah `assets/logo-omi.png` dan `assets/logo-kemenag.png` ke bucket `aset` (dashboard Supabase > Storage). Catat URL publiknya.
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
- [x] `adminLogin`, token di `CacheService`, tombol Login admin di header, modal login.
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

- [ ] `apiMulai` (buat sesi, atau lanjutkan sesi berjalan yang sama), `apiSinkron`.
- [ ] Layout tiga kolom sesuai `UI.md` dan referensi; label instruksi per tipe; opsi pg/pgk/isian; grid nomor dan penghitung terjawab; Sebelumnya/Berikutnya; Kosongkan jawaban; Refresh (sinkron jam dan simpan jawaban).
- [ ] Timer dari `akhirMs` + `offset`; ≤ 5 menit merah; habis = kirim otomatis.
- [ ] Simpan lokal tiap perubahan; sinkron server tiap 3 menit; peringatan sebelum menutup halaman.
- [ ] Responsif (< 900 px): sidebar disembunyikan, laci daftar soal.

Uji: refresh browser di tengah ujian lalu lanjut tanpa kehilangan jawaban dan waktu tidak reset; ubah jam perangkat tidak mengubah timer; acak soal/opsi konsisten saat dilanjutkan; kunci tidak terlihat di Network/respon; uji di layar 360 px; soal Arab tampil rata kanan dengan font Naskh dan jawaban isian Arab tersimpan utuh.

## M7. Hasil dan PDF

- [ ] `apiSelesai` (penilaian server, idempoten), modal konfirmasi selesai dengan jumlah belum dijawab, tombol kirim ulang saat gagal.
- [ ] Halaman hasil: identitas, nilai, benar, salah, kosong, waktu pengerjaan, tabel per nomor, kunci hanya jika `tampil_kunci`.
- [ ] Unduh PDF (html2pdf.js, `useCORS`), Cetak (`@media print`), Kembali ke beranda.

Uji: kombinasi jawaban pg/pgk/isian menghasilkan benar/salah/kosong yang tepat dan `benar+salah+kosong = total`; waktu habis mengirim otomatis; PDF terunduh di Chrome desktop, Chrome Android, Safari iOS, dan gambar, rumus, dan teks Arab ikut tampil benar (tidak terbalik/terputus); kunci muncul hanya jika diaktifkan.

## M8. Admin: hasil

- [ ] `adminHasil` dengan urutan skor, benar, salah (sedikit), waktu (cepat); tab Hasil; ekspor CSV; `adminSesiHapus`.

Uji: dua siswa berskor sama terurut sesuai aturan seri.

## M9. Uji beban dan perapian

- [ ] Uji dengan puluhan perangkat/tab serentak; catat jumlah panggilan UrlFetch; sesuaikan interval sinkron bila perlu.
- [ ] Periksa semua teks galat, keadaan kosong, fokus keyboard, kontras, dan daftar "Dilarang" di `UI.md`.
- [ ] Tulis petunjuk singkat untuk admin di `README.md`.

## Opsional di akhir Tahap 1

- [ ] Jadwal buka/tutup otomatis (`buka_at`, `tutup_at`) memengaruhi kemunculan kontainer dan pengecekan token.
- [ ] `adminUjianDuplikat`.
- [ ] Tombol "Reset" per hasil agar siswa bisa mengulang (memakai `adminSesiHapus`).

## Tahap 2 (belum)

Pembahasan soal, analisis per soal, skor parsial pgk, ganti sandi admin dari web, soal esai, deteksi pindah tab, webcam/mikrofon, optimasi kuota (cache soal, tulis langsung ke Supabase).
