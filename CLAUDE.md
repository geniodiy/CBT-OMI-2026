# CLAUDE.md

Panduan untuk Claude Code di repo ini. Baca file ini dulu, lalu `docs/PRD.md` dan `TASKS.md`.

## Proyek

**Try Out OMI 2026 CBT**, dibuat oleh Genio Institute Yogyakarta. Website ujian berbasis komputer yang meniru tampilan CBT Olimpiade Madrasah Indonesia (OMI) 2026 untuk simulasi/try out siswa. Referensi tampilan: `docs/referensi/halaman-ujian-omi.png`.

- Siswa: pilih kontainer ujian, isi data diri dan token, baca info, kerjakan, lihat hasil, download PDF.
- Admin: kelola ujian dan soal (manual atau import JSON), lihat hasil.
- Bahasa antarmuka dan semua pesan: **Bahasa Indonesia**.

## Stack dan batasan

- **Apps Script** (runtime V8) sebagai server dan penyaji halaman (`HtmlService`). Tidak ada Node/npm saat runtime.
- **Supabase** (Postgres + Storage) diakses dari server lewat `UrlFetchApp` ke REST (PostgREST). Tidak ada SDK.
- Klien: HTML/CSS/JavaScript biasa. **Tanpa framework** (tanpa React/Vue/Tailwind build).
- Library klien hanya dari `cdnjs.cloudflare.com` dan harus dipin versinya:
  - KaTeX 0.16.9 (`katex.min.css`, `katex.min.js`, `contrib/auto-render.min.js`, `contrib/mhchem.min.js`)
  - DOMPurify 3.0.6
  - html2pdf.js 0.10.1
- Font: pakai font sistem atau satu keluarga dari Google Fonts, ditambah Noto Naskh Arabic khusus teks Arab (lihat `docs/UI.md`).
- Deploy dengan **clasp** (`rootDir` = `src`).

## Struktur repo

```
CLAUDE.md, README.md, TASKS.md
docs/            PRD, ARSITEKTUR, UI, API, FORMAT-SOAL, referensi/
supabase/        schema.sql
contoh/          soal-contoh.json
assets/          logo-omi.png, logo-kemenag.png (sumber; yang dipakai web ada di Supabase Storage bucket "aset")
src/             SEMUA kode Apps Script (dikirim ke Google lewat clasp)
  appsscript.json
  Code.gs        doGet, include
  Util.gs        helper (sb_, guard_, shuffle_, dll.)
  ApiSiswa.gs    fungsi publik siswa
  ApiAdmin.gs    fungsi publik admin
  Nilai.gs       penilaian
  Index.html     kerangka halaman
  Css.html       gaya
  JsCommon.html, JsSiswa.html, JsAdmin.html, JsEditor.html
```

## Perintah

```bash
npm i -g @google/clasp
clasp login                       # dilakukan pemilik akun sendiri
clasp create --type webapp --title "Try Out OMI CBT" --rootDir src
# atau jika script sudah ada: salin .clasp.json.example menjadi .clasp.json dan isi scriptId
clasp push                        # kirim kode ke Apps Script
clasp deploy                      # buat versi deployment
```

Secret disimpan di **Script Properties** (Project Settings di editor Apps Script), bukan di kode:
`SUPABASE_URL`, `SUPABASE_KEY` (service_role), `ADMIN_PASSWORD`.

## Aturan kode (wajib)

**Keamanan**
1. `SUPABASE_KEY` (service_role) hanya dibaca di server dari Script Properties. Jangan pernah masuk HTML/JS klien.
2. Kolom `kunci` soal dan kolom `token` ujian **tidak boleh** dikirim ke siswa, kecuali kunci pada hasil dan hanya jika `ujian.tampil_kunci = true`.
3. Penilaian selalu di server (`Nilai.gs`). Klien tidak pernah menghitung skor.
4. Setiap fungsi `admin*` memanggil `guard_(tok)` di baris pertama.
5. Semua HTML dari admin/JSON disanitasi dengan DOMPurify (whitelist tag di `docs/FORMAT-SOAL.md`) **setiap kali dirender**, bukan hanya saat disimpan.
6. URL gambar hanya `https://`.
6a. Teks Arab (termasuk harakat) wajib utuh dan tampil benar kanan-ke-kiri di editor, soal, opsi, hasil, dan PDF; aturan di bagian "Teks Arab" `docs/FORMAT-SOAL.md`.

**Apps Script**
7. Fungsi publik (bisa dipanggil `google.script.run`) tanpa garis bawah di akhir nama. Helper privat berakhiran `_`.
8. Hanya data serializable lewat `google.script.run`. Objek `Date` menjadi `null`; kirim ISO string atau milidetik.
9. Jangan menulis `<?` di JavaScript klien (bentrok dengan scriptlet template). Jangan gunakan `<?= ?>` kecuali di `Index.html`.
10. Hemat panggilan `UrlFetchApp`: gabungkan query, pakai `fetchAll` bila paralel, batasi sinkron jawaban (lihat `docs/ARSITEKTUR.md`).
11. `localStorage` bisa gagal di iframe tertentu: selalu bungkus `try/catch` dan siapkan jalan keluar tanpa storage.
12. Error dilempar sebagai `throw new Error('pesan bahasa Indonesia yang jelas')`. Error sesi admin berawalan `SESI_ADMIN`.

**Gaya kode**
13. JavaScript ES2019 tanpa modul. Satu fungsi satu tugas. Komentar hanya untuk "mengapa".
14. Nama berkas dan fungsi sesuai `docs/API.md`. Jangan ganti nama tanpa memperbarui dokumen itu.
15. Jangan tambah dependensi baru tanpa alasan kuat. Jangan ubah skema database tanpa memperbarui `supabase/schema.sql` dan `docs/PRD.md`.

## Aturan tampilan (ringkas, rinci di `docs/UI.md`)

Simpel dan tegas, bukan tampilan "template AI". **Pengecualian:** halaman ujian meniru CBT OMI asli (kaca tembus pandang, bayangan lembut, ikon garis, label Title Case, animasi halus), lihat bagian 9 `docs/UI.md`. Di luar halaman ujian berlaku **Dilarang:** gradien, glassmorphism, bayangan tebal, kartu bertumpuk di dalam kartu, ikon dekoratif berlebihan, emoji di antarmuka, animasi masuk di setiap bagian, label huruf kapital semua, tanda panah "→" di tombol. Warna diambil dari logo (biru OMI, merah kecil, hijau Kemenag).

## Cara bekerja

- Kerjakan **satu milestone** di `TASKS.md` pada satu waktu. Setelah selesai, centang dan jalankan uji manual yang tertulis di milestone itu.
- Jika dokumen dan kode bertentangan, berhenti dan tanyakan; jangan menebak.
- Tidak bisa menjalankan Apps Script secara lokal. Logika murni (penilaian, normalisasi soal) taruh di fungsi terpisah tanpa ketergantungan Apps Script supaya mudah diuji dengan Node jika perlu.
