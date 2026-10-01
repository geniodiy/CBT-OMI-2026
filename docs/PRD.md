# PRD: Try Out OMI 2026 CBT

Pemilik: Genio Institute Yogyakarta. Referensi: Juknis OMI 2026 (Keputusan Dirjen Pendidikan Islam No. 6843 Tahun 2026) dan tampilan CBT OMI (`referensi/halaman-ujian-omi.png`).

## 1. Tujuan

Menyediakan simulasi CBT bergaya OMI 2026 untuk siswa bimbel, dengan pengelolaan soal yang mudah bagi admin. Bukan sistem resmi panitia OMI; header menyebut "Try Out" dan nama Genio Institute agar tidak membingungkan.

## 2. Pengguna

- **Siswa**: tanpa akun. Masuk dengan token ujian.
- **Admin**: satu kata sandi, mengelola semua ujian dan soal.

## 3. Ruang lingkup

### Tahap 1 (dikerjakan sekarang)
Beranda kontainer, popup data diri dan token, layar info sebelum mulai, halaman ujian, hasil, PDF, panel admin (ujian, soal, hasil), editor soal kaya teks, import JSON, upload gambar.

### Opsional di akhir Tahap 1 (kerjakan jika waktu ada)
Jadwal buka/tutup otomatis, duplikat ujian, hapus satu percobaan siswa agar bisa mengulang.

### Tahap 2 (belum)
Pembahasan soal, analisis per soal, skor parsial PG kompleks, ganti kata sandi admin dari web, soal esai, deteksi pindah tab/anti-curang, webcam/mikrofon.

## 4. Alur siswa

1. **Beranda**: deretan kontainer, satu kontainer = satu ujian. Isi kontainer: nama ujian, badge jenjang, mapel, sesi (jika ada), durasi, jumlah soal. Token tidak pernah tampil. Ujian dengan `aktif = false` **disembunyikan**. Urutan: jenjang, lalu mapel, lalu nama. Tombol "Login admin" di pojok kanan atas.
2. **Popup langkah 1**: nama, nomor peserta, kelas, sekolah, token. Tombol "Lanjut" hanya mengecek token ke ujian yang diklik. Belum ada sesi, timer belum jalan.
3. **Popup langkah 2 (info sebelum mulai)**: nama ujian, jenjang, mapel, jumlah soal beserta rincian tipe (contoh: 20 pilihan ganda, 5 pilihan ganda kompleks), durasi, aturan penilaian, tata tertib, catatan khusus admin (bagian ini disembunyikan jika kosong). Tombol "Kembali" dan "Mulai ujian".
4. **Mengerjakan**: timer baru berjalan saat "Mulai ujian". Layout tiga kolom (lihat `UI.md`). Jawaban tersimpan di perangkat dan disinkronkan ke server berkala. Waktu habis: jawaban terkirim otomatis.
5. **Hasil**: lihat bagian 7. Tombol "Download PDF", "Cetak", "Kembali ke beranda".

Jika siswa menutup halaman lalu membuka lagi dan memasukkan nama, nomor peserta, dan token yang sama pada ujian yang sama selagi sesinya masih berjalan, sistem **melanjutkan sesi itu** (bukan membuat baru). Setelah sesi selesai, siswa boleh mengulang; setiap percobaan tercatat sebagai sesi baru.

## 5. Alur admin

Login dengan kata sandi (Script Properties `ADMIN_PASSWORD`). Tiga tab:

- **Ujian**: tambah/ubah/hapus. Kolom: nama, jenjang, mapel, sesi, token (ada tombol acak), durasi menit, aktif, acak soal, acak opsi, tampilkan kunci di hasil, catatan khusus. Menampilkan jumlah soal. Hapus ujian ikut menghapus soal dan hasilnya (minta konfirmasi).
- **Soal**: pilih ujian, daftar soal dengan urutan yang bisa dinaikkan/diturunkan, tambah/ubah/hapus, import JSON.
- **Hasil**: pilih ujian, tabel peringkat, ekspor CSV, hapus satu hasil.

## 6. Soal

**Tipe**: `pg` (pilihan ganda), `pgk` (pilihan ganda kompleks), `isian` (isian singkat). Esai belum.

**Isi soal**: 3 bagian bebas. Tiap bagian dipilih: teks, gambar, atau kosong. Posisi bisa ditukar (seret atau tombol panah) sehingga gambar bisa di atas, tengah, atau bawah. Disimpan sebagai `blok` (array berurutan).

**Format teks**: tebal, miring, garis bawah, subskrip, superskrip, daftar, dan **LaTeX** (`$...$` sebaris, `$$...$$` baris sendiri, termasuk `\ce{...}` untuk kimia). Fitur yang sama ada di editor tiap opsi jawaban. Panel rumus punya pratinjau langsung dan tombol cepat.

**Opsi**: 2 sampai 8 (A sampai H), hanya untuk pg dan pgk.

**Gambar**: unggah dari admin (dikompres di browser, maks. lebar 1000 px), disimpan di Supabase Storage bucket `soal-img`. Bisa juga tempel URL `https://`. Pada import JSON, gambar cukup berupa blok `{"tipe":"gambar","isi":""}` yang diisi manual kemudian; soal dengan gambar kosong diberi penanda "gambar belum diisi" di daftar soal.

**Label instruksi otomatis** di atas pilihan jawaban:
- pg: "Pilih satu jawaban benar!"
- pgk: "Pilih satu atau lebih jawaban benar!"
- isian: "Ketik jawaban singkat Anda!"

## 7. Penilaian dan hasil

Aturan:
- **pg**: benar jika pilihan sama dengan kunci.
- **pgk**: benar hanya jika himpunan pilihan **sama persis** dengan kunci. Selain itu salah (skor parsial = Tahap 2).
- **isian**: benar jika cocok dengan salah satu jawaban di kunci setelah normalisasi: huruf kecil, spasi berlebih dirapikan, koma dan titik desimal dianggap sama, dan angka dibandingkan sebagai angka.
- **Kosong**: tidak ada jawaban sama sekali. Kosong **dipisah dari salah**.
- Tanpa nilai minus.
- **Nilai** = (jumlah bobot soal benar ÷ jumlah bobot semua soal) × 100, dibulatkan 2 desimal.
- `benar + salah + kosong = jumlah soal`.

Halaman hasil dan PDF memuat: identitas (nama, nomor peserta, kelas, sekolah), nama ujian, jenjang, mapel, sesi, tanggal, **waktu pengerjaan** (contoh "32 menit 15 detik"), **benar**, **salah**, **kosong**, **nilai**, dan tabel per nomor (jawaban siswa dan status). Kolom kunci hanya di layar, hanya untuk pg dan pgk, dan hanya jika `tampil_kunci`; kunci ditulis sebagai huruf abjad sesuai urutan tampilan siswa. Kunci isian tidak pernah ditampilkan. **PDF dan cetak tidak memuat kolom kunci.** Tanpa pembahasan di Tahap 1.

**Waktu pengerjaan** = dari "Mulai ujian" sampai kirim, dicatat server, maksimal sebesar durasi ujian.

**Peringkat** (tab Hasil, sesuai juknis): nilai tertinggi; jika sama: benar terbanyak, salah tersedikit, lalu waktu tercepat. Hanya sesi berstatus `selesai`.

**PDF**: dibuat di browser siswa (html2pdf.js), tidak disimpan di server. Tombol "Cetak" (`window.print()`) sebagai cadangan jika unduhan diblok. Nama berkas: `Hasil_<Nama>_<Ujian>.pdf`.

## 8. Tata tertib (teks bawaan di layar info)

Dari Juknis OMI 2026: peserta dilarang digantikan orang lain, menerima bantuan, keluar ruangan tanpa izin pengawas, memakai alat bantu seperti alat komunikasi atau kalkulator, dan membawa buku, kamus, catatan, atau tabel. Admin dapat menyesuaikan lewat kolom catatan khusus (contoh: "Kalkulator diperbolehkan").

Tambahan aturan sistem: timer berjalan di server dan tidak berhenti walau halaman ditutup; jawaban terkirim otomatis saat waktu habis; setelah dikirim, jawaban tidak dapat diubah; soal kosong tidak dihitung salah dan jawaban salah tidak mengurangi nilai.

## 9. Struktur ujian menurut juknis (sebagai acuan contoh)

| Tingkat | Bentuk |
|---|---|
| Kabupaten/Kota | 25 pilihan ganda |
| Provinsi | 20 pilihan ganda + 5 pilihan ganda kompleks |
| Nasional | 10 isian singkat + 5 esai (esai belum didukung) |

Sistem tidak membatasi jumlah atau komposisi; admin bebas.

## 10. Branding

Header: logo Kemenag dan logo OMI (`assets/`), label "Try Out OMI 2026" dan "CBT". Footer: "Dibuat oleh Genio Institute Yogyakarta". Lihat `UI.md`.

## 11. Non-fungsional

- Mendukung laptop dan HP (responsif). Prioritas: laptop/Chromebook.
- Target beban: beberapa ratus siswa dalam satu waktu. Lihat strategi di `ARSITEKTUR.md`.
- Pesan galat jelas dan berbahasa Indonesia.
- Aksesibilitas dasar: fokus keyboard terlihat, kontras cukup, target sentuh minimal 44 px.

## 12. Keputusan yang sudah diambil

| Topik | Keputusan |
|---|---|
| Beranda | Satu kontainer per ujian, bukan dua langkah jenjang lalu mapel |
| Ujian nonaktif | Disembunyikan |
| Soal kosong | Dihitung terpisah dari salah |
| Info sebelum mulai | Ada, dengan catatan khusus per ujian |
| Identitas siswa | Nama, nomor peserta, kelas, sekolah; tanpa pendaftaran |
| Mengulang ujian | Boleh; semua percobaan tercatat |
| Tipe soal | pg, pgk, isian |
| Pembahasan | Tahap 2 |
| PDF | Dibuat di browser, tidak disimpan |
| Kunci di hasil | Opsi per ujian, default mati; hanya huruf pg/pgk di layar; tidak ada di PDF dan cetak; isian tidak pernah |
| Upload gambar | Supabase Storage |
