# Arsitektur

## Gambaran

```
Browser siswa/admin
   │  HtmlService (satu halaman, pindah tampilan di sisi klien)
   │  google.script.run  (panggilan fungsi server, asinkron)
   ▼
Apps Script (server)
   │  UrlFetchApp  ──►  Supabase REST (PostgREST) + Storage
   │  CacheService / PropertiesService
   ▼
Supabase: tabel ujian, soal, sesi, view ujian_ringkas, bucket soal-img & aset
```

Klien **tidak pernah** berbicara langsung ke Supabase. Semua lewat fungsi Apps Script, sehingga kunci service_role dan kunci jawaban aman di server.

## Berkas `src/`

| Berkas | Tugas |
|---|---|
| `Code.gs` | `doGet()` menyajikan `Index.html` (template), `include(nama)` |
| `Util.gs` | `sb_()` pemanggil REST, `enc_()`, `guard_()`, `shuffle_()`, `countSoal_()`, dll. |
| `ApiSiswa.gs` | `apiBeranda`, `apiCekToken`, `apiMulai`, `apiSinkron`, `apiSelesai` |
| `ApiAdmin.gs` | semua fungsi `admin*` |
| `Nilai.gs` | `normSoal_`, `cek_`, `hitung_` (logika murni) |
| `Index.html` | kerangka, memuat library CDN dan menyertakan berkas lain |
| `Css.html` | satu tag `<style>` |
| `JsCommon.html` | helper: `call`, `toast`, `openModal`, `clean`, `blokHTML`, `mathify`, `showView` |
| `JsSiswa.html` | beranda, popup, ujian, hasil, PDF |
| `JsAdmin.html` | login, tab Ujian/Soal/Hasil, import |
| `JsEditor.html` | editor teks kaya, editor 3 bagian, editor opsi |

Penyajian: `Index.html` dievaluasi sebagai template (`createTemplateFromFile`) dan menyisipkan `<?!= include('Css') ?>` dst. Berkas yang disertakan berisi `<style>...</style>` atau `<script>...</script>`.

## Keamanan

- Script Properties: `SUPABASE_URL`, `SUPABASE_KEY` (service_role), `ADMIN_PASSWORD`.
- RLS aktif di semua tabel tanpa policy: kunci anon tidak bisa mengakses apa pun. Tetap jangan taruh kunci apa pun di klien.
- Login admin: `adminLogin(password)` membandingkan dengan `ADMIN_PASSWORD`; jika cocok membuat token acak (`Utilities.getUuid()`), menyimpannya di `CacheService` (6 jam) dan mengembalikannya. Setiap fungsi admin menerima token itu sebagai argumen pertama dan memanggil `guard_(tok)`. Jika salah sandi, `Utilities.sleep(800)` untuk memperlambat tebakan.
- Soal ke siswa: hanya `id, tipe, blok, opsi`. Tidak ada `kunci`.
- Rendering: semua HTML lewat DOMPurify whitelist, URL gambar hanya `https://`.
- Token ujian dibandingkan tanpa peka huruf besar/kecil dan dengan `trim`.

## Timer dan sesi

- `apiMulai` mencatat `mulai_at` di server dan menghitung `akhirMs = sekarang + durasi_menit × 60000`.
- Klien menerima `serverNow` dan `akhirMs`, menyimpan `offset = serverNow − Date.now()`, dan menghitung sisa = `akhirMs − (Date.now() + offset)`. Mengubah jam perangkat tidak berpengaruh.
- Saat sisa mencapai 0, klien memanggil `apiSelesai` otomatis.
- `apiSelesai` di server tetap menerima kiriman meski terlambat beberapa menit (jaringan lambat), tetapi `durasi_detik` dibatasi `durasi_menit × 60`.
- `apiSelesai` bersifat idempoten: jika sesi sudah `selesai`, hasil dihitung ulang dari jawaban tersimpan dan tidak ada perubahan data.
- Melanjutkan sesi: `apiMulai` yang menemukan sesi `berjalan` dengan (ujian, nama tanpa peka huruf, nomor peserta) sama dan belum lewat waktu akan mengembalikan sesi itu beserta jawaban terakhir yang tersinkron, bukan membuat baru.

## Penyimpanan jawaban

1. Setiap perubahan jawaban langsung ditulis ke `localStorage` (kunci `cbt_sesi_v1`), dibungkus `try/catch`.
2. `apiSinkron(sesiId, jawaban)` menyimpan ke kolom `sesi.jawaban`. Dipanggil: tiap **3 menit**, saat tombol Refresh, dan sebelum pindah halaman jika memungkinkan.
3. Saat halaman dibuka ulang dan `localStorage` berisi sesi yang belum lewat waktu, tampilkan kotak "Lanjutkan ujian".

## Beban dan kuota

Batas Apps Script (verifikasi angka terbaru di dokumentasi Google, bisa berubah): jumlah eksekusi bersamaan per pengguna terbatas (sekitar 30), kuota `UrlFetch` per hari berbeda untuk akun gratis dan Google Workspace, waktu eksekusi maksimum 6 menit per panggilan.

Perkiraan panggilan `UrlFetch` per siswa untuk ujian 2 jam (sesuai kode saat ini):
- `apiBeranda`: 0 bila ada di cache (60 detik), selain itu 1. `apiCekToken`: 1.
- `apiMulai`: 4 (ujian, cari sesi, buat sesi, soal). Dilanjutkan dari sesi lama: 3.
- `apiSinkron`: 1 tiap 3 menit, dan hanya bila jawaban berubah (maks. ±40; durasi ujian dibagi 3 menit). Durasi ujian di-cache 10 menit.
- `apiSelesai`: 4 (sesi, ujian dan soal lewat `fetchAll`, simpan).
- Total ±10 sampai 50 per siswa, jadi 200 siswa ≈ 2.000 sampai 10.000 panggilan. Periksa kuota akun Anda sebelum acara besar (lihat `docs/UJI-BEBAN.md`).

Langkah hemat yang wajib:
- Soal dikirim **sekali** saat mulai; klien tidak meminta soal per nomor.
- Beranda memakai satu query ke view `ujian_ringkas` dan hasilnya di-cache di `CacheService` 60 detik. Cache dihapus saat admin menyimpan ujian.
- Jangan sinkron per klik.

Optimasi jika kuota/konkurensi kurang (jangan dikerjakan di awal): cache soal+kunci per ujian di `CacheService` (potong per ≤90 KB karena batas nilai per kunci); atau pindahkan `apiSinkron` agar klien menulis langsung ke Supabase dengan RLS dan token sesi sendiri.

## Gambar

`adminUpload(tok, base64, mime, nama)`: klien mengecilkan gambar (lebar maks. 1000 px, JPEG kualitas 0,85 atau PNG), mengirim base64 ke server, server mengunggah ke `storage/v1/object/soal-img/<uuid>.<ext>` dengan service_role dan mengembalikan URL publik `.../storage/v1/object/public/soal-img/<uuid>.<ext>`. Batas 3 MB per gambar.

Logo web dibaca dari bucket `aset` (URL publik) agar ringan dan ter-cache; unggah `assets/logo-omi.png` dan `assets/logo-kemenag.png` ke bucket itu secara manual lewat dashboard Supabase.

## PDF hasil

Dibuat di browser dengan html2pdf.js dari elemen `#hasilCetak`. `useCORS: true` agar gambar tidak kosong. `page-break-inside: avoid` pada baris tabel. Bila unduhan diblok iframe/browser tertentu, tombol "Cetak" memakai `window.print()` dan CSS `@media print` yang hanya menampilkan `#hasilCetak`. Uji di Chrome desktop, Chrome Android, dan Safari iOS.

## Penanganan galat

- Semua panggilan klien lewat `call(fn, ...args)` yang mengembalikan Promise dan melempar `Error` berpesan Indonesia.
- Kegagalan kirim jawaban akhir: jangan hapus data lokal; tampilkan tombol "Kirim ulang".
- Galat database dari `sb_()` diubah menjadi pesan umum untuk siswa; detail teknis hanya untuk admin atau log.
