# API (fungsi server Apps Script)

Dipanggil dari klien lewat `google.script.run`. Semua mengembalikan data serializable (tanpa `Date`; waktu = ISO string atau milidetik). Galat = `throw new Error('pesan Indonesia')`.

Fungsi `admin*` menerima **token admin sebagai argumen pertama** dan memanggil `guard_(tok)`. Jika token tidak sah atau kedaluwarsa: `throw new Error('SESI_ADMIN: masuk kembali')`.

## Tipe data

```ts
type Tipe = 'pg' | 'pgk' | 'isian';
type Blok = { tipe: 'teks' | 'gambar'; isi: string };       // teks = HTML aman + LaTeX; gambar = URL https atau ''
type Opsi = { k: string; h: string };                          // k = 'A'..'H', h = HTML aman + LaTeX
type Jawaban = { [soalId: string]: string[] };                 // pg/pgk: kunci opsi; isian: [teks]

type KontainerUjian = {
  id: string; nama: string; jenjang: string; mapel: string; sesi: string | null;
  durasi_menit: number; jumlah_soal: number; n_pg: number; n_pgk: number; n_isian: number;
};
```

## Siswa (tanpa autentikasi)

### `apiBeranda(): KontainerUjian[]`
Ujian dengan `aktif = true` dan jadwal terbuka (di antara `buka_at` dan `tutup_at` bila diisi) dari view `ujian_ringkas`, **tanpa token**. Urut: jenjang (MI, MTs, MA lebih dulu, sisanya abjad), mapel, nama. Di-cache 60 detik (`CacheService`, kunci `beranda_v1`).

### `apiCekToken(ujianId, token): { ujian: KontainerUjian & { catatan: string|null } }`
Langkah 1 popup. Mengecek `aktif` dan token (trim, tidak peka huruf). Galat: "Ujian tidak ditemukan atau belum dibuka.", "Ujian ini belum dibuka. Dibuka pada 1 Oktober 2026, 08.00 WIB.", "Ujian ini sudah ditutup pada ...", "Token tidak cocok. Periksa kembali token dari pengawas.", "Ujian ini belum memiliki soal."

### `apiMulai(ujianId, token, peserta): SesiMulai`
`peserta = { nama, nomor, kelas, sekolah }` (nama wajib, maks. 100 karakter; lainnya opsional).
Memeriksa token lagi. Jika ada sesi `berjalan` dengan ujian sama + nama (tanpa peka huruf) + nomor sama dan waktunya belum habis, **mengembalikan sesi itu** (lanjut). Jika tidak, membuat sesi baru.
```ts
type SesiMulai = {
  sesiId: string; serverNow: number; akhirMs: number;
  ujian: { nama; jenjang; mapel; sesi; durasi_menit };
  peserta: { nama; nomor; kelas; sekolah };
  soal: { id: string; tipe: Tipe; blok: Blok[]; opsi: Opsi[] }[];   // TANPA kunci
  jawaban: Jawaban;                                                   // terakhir tersinkron (kosong jika baru)
  lanjut: boolean;
};
```
Soal diacak jika `acak_soal`; opsi diacak jika `acak_opsi` (huruf tampilan = urutan, `k` tetap asli; klien memetakan `k` ke huruf posisi). Urutan acak **harus sama** jika sesi dilanjutkan: simpan urutan di sesi, atau gunakan acak dengan seed dari `sesiId`.

### `apiSinkron(sesiId, jawaban): { ok: true; serverNow: number; akhirMs: number }`
Menyimpan `jawaban` ke `sesi.jawaban` dan `terakhir_sinkron`. Menolak jika sesi sudah `selesai`. Dipakai juga untuk sinkron jam (tombol Refresh).

### `apiSelesai(sesiId, jawaban): Hasil`
Menilai di server, menyimpan, mengembalikan hasil. Idempoten (sesi `selesai` dihitung ulang dari jawaban tersimpan).
```ts
type Hasil = {
  nama; nomor; kelas; sekolah;
  ujian: { nama; jenjang; mapel; sesi };
  selesaiAt: string;                 // ISO
  durasi: number;                    // detik, maks. durasi_menit*60
  benar: number; salah: number; kosong: number; total: number; skor: number;
  tampilKunci: boolean;
  rincian: { id: string; status: 'benar'|'salah'|'kosong'; jawaban: string[]; kunci: string[] | null }[];
};
```
`kunci` hanya terisi jika `tampilKunci` dan tipe soal pg atau pgk (kunci isian selalu `null`). Huruf kunci dan jawaban adalah huruf asli opsi (`k`); klien memetakannya ke huruf tampilan. `rincian` dalam urutan database (`urutan`); klien memetakan ke nomor sesuai urutan tampilan.

## Admin

### `adminLogin(password): { tok, ujian }`
Mengembalikan token admin (6 jam). Salah sandi: "Kata sandi salah." setelah jeda 800 ms.

- `adminKeluar(tok): true` menghapus token sesi admin.

### Ujian
- `adminUjianList(tok): (UjianRow & { jumlah_soal, n_pg, n_pgk, n_isian, n_gambar_kosong, n_selesai, n_berjalan })[]` (termasuk token dan semua kolom). Bila view `ujian_ringkas` belum punya kolom `n_selesai`/`n_berjalan` (skema lama), server menghitungnya dari tabel `sesi`.
- `adminUjianSimpan(tok, u): UjianRow` tanpa `id` = tambah, dengan `id` = ubah. Validasi: nama, jenjang, mapel, token wajib; durasi ≥ 1; `buka_at`/`tutup_at` opsional (ISO), tutup harus setelah buka. Hanya kolom yang diizinkan. Menghapus cache `beranda_v1`.
- `adminUjianHapus(tok, id): true` menghapus beserta soal dan sesi.
- `adminUjianDuplikat(tok, id, namaSalinan?): UjianRow` menyalin ujian dan soalnya (hasil siswa tidak disalin); token baru acak, `aktif = false`, tanpa jadwal, nama = `namaSalinan` (maks. 150) atau nama asli + " (salinan)". Bila penyalinan soal gagal, ujian salinan dibatalkan.

### Soal
- `adminSoalList(tok, ujianId): SoalRow[]` urut `urutan`, lalu `created_at`; termasuk `kunci`.
- `adminSoalSimpan(tok, s): SoalRow` `s = { id?, ujian_id, tipe, blok, opsi, kunci, bobot }`. Divalidasi dengan `normSoal_` (aturan di `FORMAT-SOAL.md`). Soal baru mendapat `urutan = maks + 1`. Mengembalikan baris soal ditambah `peringatan: string[]`. Pesan galat dari editor manual tanpa awalan "Soal #N".
- `adminSoalHapus(tok, id): true`
- `adminSoalUrut(tok, ujianId, idsBerurutan: string[]): true` menulis ulang `urutan` 1..n.
- `adminSoalImport(tok, ujianId, daftar, mode, dryRun): { jumlah: number; per_tipe: {pg,pgk,isian}; gambar_kosong: number[]; peringatan: string[] }`
  `mode` = `'tambah'` | `'ganti'`. `dryRun = true` hanya memeriksa. Galat pertama menghentikan dengan pesan "Soal #N: ...". Peringatan (tidak menghentikan): kata LaTeX tanpa garis miring (`sqrt`, `frac`, `alpha`, `times`, dst.) di luar tanda `$`, tanda `$` tidak berpasangan, teks soal sangat pendek. Insert dalam potongan ≤ 50 baris. Mode `ganti` memasukkan soal baru lebih dulu, baru menghapus soal lama, supaya gagal di tengah tidak menghilangkan soal. `daftar` boleh array atau `{soal: [...]}`. Hasil juga memuat `pratinjau`: maks. 10 soal pertama setelah normalisasi (untuk pratinjau di modal).

### Gambar
- `adminUpload(tok, base64, mime, nama): string` (URL publik). `mime` ∈ image/png, image/jpeg, image/webp, image/gif. Maks. 3 MB. Galat: "Format gambar harus PNG, JPG, WEBP, atau GIF."

### Hasil
- `adminHasil(tok, ujianId): HasilRow[]` hanya `status = 'selesai'`, **tanpa kolom `jawaban`**, urut: `skor desc, benar desc, salah asc, durasi_detik asc`. Kolom: id, nama, nomor_peserta, kelas, sekolah, benar, salah, kosong, skor, durasi_detik, selesai_at.
- `adminHasilDetail(tok, sesiId): { sesi, rincian[] }` rincian satu hasil. `sesi` = kolom hasil tanpa `jawaban`. `rincian` = satu entri per soal ujian (urutan sama dengan tab Soal): `{ no, id, tipe, status: 'benar'|'salah'|'kosong'|'disembunyikan', jawaban[], kunci[], blok[] }`; `blok` (hanya blok teks) hanya terisi untuk soal salah atau kosong. Penilaian memakai `hitung_` pada soal yang tampil ke siswa, sama seperti `apiSelesai`. Dipakai admin saja (memuat kunci).
- `adminSesiHapus(tok, sesiId): true`

## Fungsi privat (`Util.gs`, `Nilai.gs`)

- `sb_(method, path, body, extraHeaders)` memanggil `SUPABASE_URL + '/rest/v1/' + path` dengan header `apikey` dan `Authorization: Bearer <service_role>`; melempar galat jika status ≥ 300.
- `guard_(tok)`, `enc_(v)`, `shuffle_(arr)`, `seedShuffle_(arr, seed)`.
- `normSoal_(x, i)` normalisasi dan validasi satu soal (dipakai import dan simpan manual).
- `cek_(soal, jawabanArray): boolean`, `norm_(teks)`, `hitung_(daftarSoal, jawaban): {benar, salah, kosong, skor, rincian}`.

## Aturan `cek_`

```
pg     : jawaban.length === 1 && jawaban[0] === kunci[0]
pgk    : jawaban tidak kosong && himpunan(jawaban) sama persis dengan himpunan(kunci)
isian  : j = norm_(jawaban[0]); j tidak kosong &&
         kunci.some(k => norm_(k) === j || (isNumber(j) && isNumber(norm_(k)) && Number(j) === Number(norm_(k))))
norm_  : trim, huruf kecil, spasi beruntun jadi satu, koma menjadi titik
kosong : jawaban tidak ada / array kosong / isian hanya spasi
```
