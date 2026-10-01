# Try Out OMI 2026 CBT

Website ujian berbasis komputer bergaya CBT Olimpiade Madrasah Indonesia (OMI) 2026 untuk simulasi siswa. Dibuat oleh Genio Institute Yogyakarta.

Stack: Google Apps Script (server + halaman) dan Supabase (database + penyimpanan gambar). Bukan sistem resmi panitia OMI.

## Dokumen

- `CLAUDE.md` panduan untuk Claude Code
- `docs/PRD.md` kebutuhan produk dan keputusan
- `docs/ARSITEKTUR.md` arsitektur, keamanan, beban
- `docs/UI.md` panduan tampilan
- `docs/API.md` fungsi server
- `docs/FORMAT-SOAL.md` format soal dan import JSON, prompt untuk AI
- `TASKS.md` urutan pengerjaan
- `supabase/schema.sql` skema database
- `contoh/soal-contoh.json` contoh berkas import
- `docs/UJI-BEBAN.md` cara menguji banyak siswa serentak
- `tests/` uji Node tanpa dependensi (`node tests/jalankan.js`)

## Menyiapkan

1. **Supabase**: buat project, jalankan `supabase/schema.sql` di SQL Editor. Unggah logo di `assets/` ke bucket `aset`.
2. **Apps Script**: buat project, lalu di Project Settings > Script Properties isi:
   - `SUPABASE_URL` (contoh `https://xxxx.supabase.co`)
   - `SUPABASE_KEY` (kunci **service_role**, rahasia)
   - `ADMIN_PASSWORD`
3. **clasp**:
   ```bash
   npm i -g @google/clasp
   clasp login
   cp .clasp.json.example .clasp.json   # isi scriptId
   clasp push
   ```
4. **Deploy**: di editor Apps Script, Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.

`.clasp.json` dan kunci apa pun jangan pernah di-commit.

Setiap kali kode berubah: `clasp push`, lalu Deploy > Manage deployments > edit deployment web app > Version: New version. URL tetap sama.

## Petunjuk singkat untuk admin

**Masuk.** Buka web app, klik "Login admin", isi kata sandi (nilai `ADMIN_PASSWORD`). Sesi berlaku 6 jam. Mengganti sandi dilakukan di Script Properties.

**Membuat ujian (tab Ujian).** Klik "Tambah ujian". Isi nama, jenjang, mapel, durasi, dan token (tombol "Acak" membuat token baru). Centang "Tampil di beranda" agar siswa melihatnya. "Catatan dari pengawas" muncul di layar sebelum mulai. Bagikan token ke siswa lewat pengawas, jangan ditempel di layar yang bisa dilihat siswa lain. "Buka otomatis" dan "Tutup otomatis" (opsional) mengatur kapan ujian tampil di beranda; setelah waktu tutup tidak ada peserta baru, tetapi siswa yang sudah mulai boleh menyelesaikannya. "Duplikat" menyalin ujian dan soalnya sebagai ujian nonaktif bertoken baru, cocok untuk sesi kedua dengan soal yang sama.

**Mengisi soal (tab Soal).** Pilih ujian, lalu:
- *Manual*: "Tambah soal". Isi soal terdiri dari beberapa bagian (teks atau gambar) yang urutannya bisa ditukar dengan Naik dan Turun. Blok teks lalu klik Kiri, Tengah, atau Kanan untuk mengatur perataan. Rumus lewat tombol "Rumus" (LaTeX, kimia dengan `\ce{}`). Teks Arab boleh ditempel langsung, harakat tetap utuh. Klik "Pratinjau" untuk melihat tampilan siswa.
- *Import JSON*: "Import JSON", salin prompt untuk AI, kirim bersama dokumen soal ke AI, tempel hasilnya, klik "Periksa", lalu "Impor". Soal bergambar ditandai "Gambar belum diisi"; buka soalnya dan unggah gambarnya. Soal yang gambarnya belum diisi tidak tampil ke siswa.

**Sebelum ujian.** Buka ujian sebagai siswa dan kerjakan satu kali dari beranda sampai hasil, lalu hapus percobaan itu di tab Hasil. Periksa jumlah soal, rumus, gambar, dan kunci.

**Saat ujian.** Siswa memasukkan nama, nomor peserta, dan token. Jika halaman tertutup, siswa membuka lagi, memasukkan data yang sama, dan melanjutkan; waktu tidak berhenti. Jawaban terkirim otomatis saat waktu habis.

**Hasil (tab Hasil).** Peringkat berdasarkan nilai, lalu benar terbanyak, salah tersedikit, dan waktu tercepat. "Ekspor CSV" membuka rapi di Excel berbahasa Indonesia. "Reset" menghapus satu hasil agar siswa dapat mengulang. PDF siswa tidak memuat kunci jawaban.

**Jika ada masalah.** Siswa yang melihat "Server sedang sibuk" cukup menunggu beberapa detik dan mencoba lagi; jawabannya tersimpan di perangkat. Bila sinkron gagal berulang, lihat kuota di Apps Script (menu Executions) dan `docs/UJI-BEBAN.md`.

## Mengerjakan dengan Claude Code

Buka folder ini di Claude Code. Ia membaca `CLAUDE.md` otomatis. Kerjakan satu milestone di TASKS.md pada satu waktu.
