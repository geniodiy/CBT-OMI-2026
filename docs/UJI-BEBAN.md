# Uji Beban dan Kuota

Apps Script tidak bisa dijalankan lokal, jadi uji beban dilakukan pada deployment sungguhan. Kode di repo ini sudah menghemat panggilan (lihat `ARSITEKTUR.md`), tetapi angka kuota Google berubah-ubah. **Periksa kuota terbaru di dokumentasi Apps Script ("Quotas for Google Services") sebelum acara besar.** Ada tiga hal yang perlu diuji: kuota `UrlFetch` per hari, jumlah eksekusi bersamaan, dan kecepatan respons saat banyak siswa mulai bersamaan.

## Perkiraan panggilan UrlFetch per siswa

| Fungsi | Panggilan | Kapan |
|---|---|---|
| `apiBeranda` | 0 (cache 60 detik) atau 1 | membuka beranda |
| `apiCekToken` | 1 | langkah 1 popup |
| `apiMulai` | 4 (3 bila melanjutkan) | tombol Mulai ujian |
| `apiSinkron` | 1 tiap 3 menit, hanya bila ada perubahan jawaban | selama ujian, tombol Refresh |
| `apiSelesai` | 4 | kirim jawaban |

Ujian 2 jam: paling banyak ±50 panggilan per siswa; umumnya 15 sampai 30. Kalikan dengan jumlah siswa dan bandingkan dengan kuota harian akun Anda (akun gratis lebih kecil daripada Google Workspace).

## Langkah uji

1. Buat ujian uji (misalnya 25 soal, durasi 10 menit) dan token sederhana.
2. Siapkan perangkat: laptop, HP, dan tablet yang tersedia, sebanyak mungkin. Satu perangkat boleh membuka beberapa tab atau jendela penyamaran (incognito); setiap tab dianggap siswa terpisah bila nama berbeda.
3. Minta semua perangkat melakukan langkah ini **pada saat yang sama** (hitung mundur dari pengawas): buka web app, pilih ujian, isi data dan token, klik Mulai ujian.
4. Catat waktu dari klik "Mulai ujian" sampai soal pertama tampil. Terima bila umumnya di bawah 5 detik dan tidak ada yang gagal.
5. Kerjakan beberapa soal, tunggu satu kali sinkron (3 menit) atau tekan Refresh.
6. Semua perangkat menekan "Kirim jawaban" bersamaan.
7. Buka tab Hasil. Jumlah hasil harus sama dengan jumlah siswa uji, dan `benar + salah + kosong` sama dengan jumlah soal.
8. Di editor Apps Script, buka **Executions**. Lihat jumlah eksekusi, galat, dan durasi. Galat berbunyi "Service invoked too many times" atau "Too many simultaneous invocations" berarti batas tercapai.
9. Hapus hasil uji di tab Hasil.

## Bila batas tercapai

Urutan tindakan, mulai yang paling murah:
1. Perlebar jarak antar-mulai: bagi siswa ke beberapa sesi (fitur "Sesi" pada ujian) atau minta pengawas memulai bergelombang.
2. Naikkan interval sinkron dari 3 menit menjadi 5 menit (konstanta `INTERVAL_SINKRON_MS` di `JsSiswa.html`). Jawaban tetap tersimpan di perangkat tiap perubahan, jadi risikonya hanya pada pemulihan di perangkat lain.
3. Pakai akun Google Workspace untuk memiliki script (kuota lebih besar).
4. Optimasi lanjutan (belum dikerjakan; lihat `ARSITEKTUR.md`): cache soal dan kunci per ujian di `CacheService`, atau klien menulis langsung ke Supabase.

## Mengapa jawaban aman walau server sibuk

- Setiap perubahan jawaban ditulis ke `localStorage` perangkat siswa terlebih dulu.
- Sinkron yang gagal diam-diam diulang pada siklus berikutnya.
- Pengiriman akhir yang gagal menampilkan tombol "Kirim ulang" dan tidak menghapus data lokal.
- Timer dihitung dari jam server yang diterima saat mulai, jadi lambatnya server tidak memperpanjang atau memperpendek waktu siswa.
