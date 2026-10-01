# Format Soal dan Import JSON

Format yang sama dipakai editor manual (disimpan ke database) dan import JSON.

## Struktur satu soal

```json
{
  "tipe": "pg",
  "blok": [
    { "tipe": "teks",   "isi": "Perhatikan gambar berikut." },
    { "tipe": "gambar", "isi": "" },
    { "tipe": "teks",   "isi": "<b>Pertanyaan</b><br>Panjang sisi miring adalah ..." }
  ],
  "opsi": { "A": "$3$", "B": "$4$", "C": "$5$", "D": "$6$" },
  "kunci": ["C"],
  "bobot": 1
}
```

| Kolom | Wajib | Aturan |
|---|---|---|
| `tipe` | ya | `pg`, `pgk`, atau `isian` (alias diterima: `pilihan ganda`, `pg kompleks`, `isian singkat`) |
| `blok` | ya* | Daftar bagian soal berurutan. Tiap bagian `{tipe:"teks"\|"gambar", isi}`. Minimal satu bagian teks. Urutan = urutan tampil, jadi gambar bisa di atas, tengah, atau bawah. |
| `teks`, `gambar` | alternatif | Jika `blok` tidak ada: `teks` menjadi bagian pertama, `gambar` (URL atau `""`) menjadi bagian kedua. |
| `opsi` | pg, pgk | Objek `{"A":"...","B":"..."}` atau array `["...","..."]` (huruf otomatis). 2 sampai 8 opsi. Dilarang untuk `isian` (diabaikan). |
| `kunci` | ya | pg: tepat 1 huruf `["B"]`. pgk: 1 atau lebih `["A","C"]`. isian: jawaban yang diterima `["12,5","12.5"]` atau string `"12,5 \| 12.5"`. |
| `bobot` | tidak | Angka > 0, default 1. |

*Soal tanpa teks ditolak.

Bagian gambar dengan `isi: ""` berarti "gambar menyusul": soal tetap tersimpan, ditandai "gambar belum diisi" di daftar soal, dan tidak ditampilkan ke siswa sampai diisi.

Import menerima array soal, atau objek `{ "soal": [ ... ] }`. Pembungkus pagar kode ```json ... ``` dibuang otomatis.

## Pemformatan teks

**HTML yang diizinkan** (selain itu dibuang oleh DOMPurify): `b`, `strong`, `i`, `em`, `u`, `sub`, `sup`, `br`, `p`, `div`, `span`, `ul`, `ol`, `li`, serta tabel: `table`, `thead`, `tbody`, `tr`, `th`, `td`. Atribut yang lolos: `class` dengan nilai `rata-kiri`, `rata-tengah`, `rata-kanan`, atau `rata-penuh` (perataan teks dari editor; `rata-penuh` = rata kiri dan kanan/justify); nilai class lain dibuang, begitu juga `style` dan atribut lain.

**Tabel**: tabel dibuat dengan tombol tabel di toolbar editor (jumlah baris dan kolom, opsi baris judul; saat kursor berada di dalam tabel muncul tombol tambah/hapus baris, tambah/hapus kolom, dan hapus tabel; Tab pindah antar sel). Tabel yang disalin dari Word atau Excel otomatis menjadi tabel (baris pertama sebagai judul). Di JSON, tabel ditulis sebagai HTML di dalam blok teks, satu tabel satu blok: `<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>`. Sel digabung dengan `colspan='2'` atau `rowspan='2'` (hanya angka 2 sampai 12); atribut lain (`style`, `border`, `width`) dibuang. Tabel tidak didukung di dalam opsi jawaban (editor opsi memakai versi mini).

**LaTeX** dirender KaTeX:
- Sebaris: `$ ... $` (juga `\( ... \)`)
- Baris sendiri: `$$ ... $$` (juga `\[ ... \]`)
- Kimia: `$\ce{H2O}$`, `$\ce{2H2 + O2 -> 2H2O}$` (ekstensi mhchem)
- Satuan di dalam rumus: `$5\,\text{m/s}$`

**Peringatan penting untuk JSON**: garis miring terbalik harus ditulis **dua kali** di berkas JSON. LaTeX `\frac{a}{b}` ditulis `"$\\frac{a}{b}$"`. Jika hanya satu, `\f` dibaca sebagai karakter lain dan rumus rusak. Di editor manual cukup satu garis miring.

Gejala paling umum dari konversi AI yang salah: tampil `10sqrt17` alih-alih akar. Sistem memberi peringatan jika menemukan kata seperti `sqrt`, `frac`, `alpha`, `times`, `leq` di luar rumus yang benar.

## Teks Arab

Soal bahasa Arab dan kutipan ayat/hadis harus bisa ditempel (copy-paste) apa adanya dan tampil benar.

- **Penyimpanan**: semua teks UTF-8 apa adanya (Postgres, Apps Script, JSON). Harakat (fathah, kasrah, dhammah, sukun, syaddah, tanwin) dan huruf khusus tidak boleh hilang.
- **Tempel**: editor selalu menempel sebagai teks polos (Unicode dipertahankan). Saat tempel dan saat impor, teks dinormalisasi: bentuk presentasi Arab (U+FB50-FDFF, U+FE70-FEFF, biasanya hasil salin dari PDF) diubah ke huruf dasar dengan NFKC; karakter kendali arah tersembunyi (U+200E, U+200F, U+202A-202E, U+2066-2069) dibuang; ZWNJ/ZWJ dipertahankan.
- **Arah tulisan**: setiap rangkaian huruf Arab dibungkus saat render dengan `<span class="ar" dir="rtl" lang="ar">` setelah sanitasi DOMPurify, jadi admin tidak perlu atribut `dir`. Blok yang seluruhnya Arab diberi kelas `ar-blok` (rata kanan). Opsi pilihan ganda berisi Arab tetap sejajar dengan huruf opsinya.
- **Font**: Noto Naskh Arabic (lihat `UI.md`), ukuran lebih besar dari teks Latin agar harakat terbaca.
- **Isian**: pencocokan jawaban Arab mengabaikan harakat dan tatwil (U+0640), dan menyamakan variasi alif (أ إ آ ا), ya (ى ي), dan ta marbutah (ة).
- **Dalam rumus**: teks Arab di dalam `$...$` ditulis dengan `\text{...}`.
- **PDF**: html2pdf.js memotret DOM, sehingga font Arab harus sudah termuat sebelum PDF dibuat (`document.fonts.ready`).
- Catatan: teks Arab yang disalin dari PDF terkadang urutan hurufnya terbalik atau terputus; ini tidak bisa diperbaiki otomatis. Admin diminta memeriksa pratinjau, dan prompt AI di bawah meminta AI menuliskan ulang teks Arab dalam urutan logis (bukan visual).

## Aturan validasi (`normSoal_`)

Galat (menghentikan, berbentuk "Soal #N: ..."):
- tipe tidak dikenal
- teks soal kosong
- opsi kurang dari 2 (pg, pgk)
- kunci kosong
- kunci tidak ada di daftar opsi
- pg dengan kunci selain tepat satu

Peringatan (tidak menghentikan): rumus tanpa garis miring, `$` tidak berpasangan, `bobot` tidak valid (dipakai 1), gambar `isi` bukan `https://`.

## Prompt untuk AI (tombol "Salin prompt untuk AI")

Simpan sebagai konstanta `PROMPT_AI` di `JsAdmin.html` memakai `String.raw` agar garis miring ganda tidak hilang. Isinya tidak boleh memuat tanda backtick atau `${`. Import membuang teks di luar JSON (baris `LANJUT:` atau `CATATAN:`) sebelum mengurai.

````text
PERAN
Kamu adalah konverter soal ujian. Tugasmu mengubah soal pada dokumen terlampir (PDF atau Word) menjadi satu JSON array yang bisa langsung diimpor ke website CBT. Kerjakan semua soal di dokumen, jangan ada yang dilewati.

KELUARAN
- Keluarkan HANYA JSON yang valid. Tanpa kalimat pembuka, tanpa penjelasan, tanpa pagar kode markdown.
- Bentuknya array: [ {soal 1}, {soal 2}, ... ] sesuai urutan di dokumen.

FORMAT SATU SOAL
{
  "tipe": "pg",
  "blok": [
    {"tipe": "teks", "isi": "Narasi atau stimulus soal."},
    {"tipe": "gambar", "isi": ""},
    {"tipe": "teks", "isi": "<b>Pertanyaan</b><br>Kalimat pertanyaan ..."}
  ],
  "opsi": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "kunci": ["B"],
  "bobot": 1
}

ATURAN TIPE DAN KUNCI
1. "pg" (pilihan ganda): tepat satu kunci, contoh ["B"]. Opsi A sampai D (atau sampai E bila dokumen memiliki 5 opsi).
2. "pgk" (pilihan ganda kompleks / pilih lebih dari satu jawaban benar): satu atau lebih kunci, contoh ["A","C"]. Dipakai bila soal berbunyi "pilih semua jawaban yang benar", "jawaban benar lebih dari satu", dan sejenisnya.
3. "isian" (isian singkat): TANPA "opsi". "kunci" berisi semua bentuk jawaban yang boleh diterima, contoh ["12,5","12.5"]. Jawaban isian singkat berupa teks atau angka biasa, bukan huruf opsi.
4. Jangan menulis huruf opsi ("A.", "B)") di dalam isi opsi. Huruf sudah menjadi nama kunci objek.
5. "bobot" bernilai 1 kecuali dokumen menyebut bobot lain.
6. Kunci jawaban diambil dari lembar kunci di dokumen bila ada. Bila tidak ada, isi dengan jawaban yang paling tepat menurutmu, dan catat nomor soal tersebut di bagian CATATAN AKHIR (lihat bawah).

ATURAN ISI SOAL (blok)
7. Susun isi soal per bagian, satu bagian satu blok, dengan urutan seperti di dokumen: (a) kalimat pengantar, (b) ayat atau hadis, (c) cerita, data, atau stimulus, (d) gambar, (e) pertanyaan. Jangan menggabungkan bagian yang berbeda ke satu blok, dan jangan memecah satu bagian ke banyak blok. Blok pertanyaan diawali <b>Pertanyaan</b><br> lalu kalimat pertanyaannya. Di dalam satu blok, pisahkan paragraf dengan <br><br>.
8. Bila soal memiliki gambar, grafik, diagram, tabel berupa gambar atau foto, atau peta, sisipkan blok {"tipe":"gambar","isi":""} tepat di posisi gambar itu (di atas, tengah, atau bawah teks). Biarkan "isi" KOSONG. Gambar diunggah manual di website. Satu soal boleh punya beberapa blok gambar.
9. Bila SEBUAH OPSI berupa gambar, tulis teks opsinya "(gambar)" dan sebutkan nomor soal itu di CATATAN AKHIR.
10. TABEL: bila di dokumen ada tabel berisi teks atau angka, WAJIB dibuat sebagai tabel HTML, jangan diubah menjadi daftar atau teks biasa. Taruh satu tabel dalam satu blok teks tersendiri, pada posisi yang sama dengan di dokumen (kalimat pengantar dan pertanyaan di blok lain). Bentuk: <table><thead><tr><th>Kolom 1</th><th>Kolom 2</th></tr></thead><tbody><tr><td>isi</td><td>isi</td></tr></tbody></table>. Baris judul memakai <th> di dalam <thead>; bila tabel tidak punya baris judul, langsung <tbody> berisi <td>. Sel yang digabung memakai colspan='2' atau rowspan='2' (tanda kutip tunggal, angka 2 sampai 12). Isi sel boleh memakai <b>, <i>, <sup>, <sub>, <br>, dan rumus $...$. Jangan memakai atribut lain (style, border, width). Batas: sampai 8 kolom dan 12 baris. Tabel yang lebih besar, berupa foto atau hasil pindai, atau berisi gambar di dalam selnya, dijadikan blok gambar kosong dan dicatat di CATATAN AKHIR. Tabel tidak boleh berada di dalam opsi jawaban: bila sebuah opsi berupa tabel, tulis opsi itu sebagai teks ringkas dengan <br> dan catat nomor soalnya di CATATAN AKHIR.
11. Pertahankan nomor, urutan, kata, dan angka apa adanya. Jangan memperbaiki, menyingkat, atau menerjemahkan. Buang nomor soal ("1.", "2.") dari awal teks, tetapi jangan ubah isinya.
12. Buang header, footer, nomor halaman, nama instansi, dan petunjuk umum ujian yang bukan bagian soal.

ATURAN FORMAT TEKS
13. HTML yang boleh dipakai HANYA: <b>, <strong>, <i>, <em>, <u>, <sub>, <sup>, <br>, <p>, <div>, <span>, <ul>, <ol>, <li>, serta <table>, <thead>, <tbody>, <tr>, <th>, <td> (atribut yang boleh hanya class pada perataan dan colspan/rowspan pada <th>/<td>). Tag lain dan atribut style dilarang.
14. Baris baru di dalam teks ditulis <br>, bukan karakter enter di dalam string JSON.
15. Perataan teks (hanya bila di dokumen memang rata tengah, rata kanan, atau rata kiri-kanan): bungkus dengan <div class='rata-tengah'>...</div>, <div class='rata-kanan'>...</div>, atau <div class='rata-penuh'>...</div>. Selalu pakai tanda kutip TUNGGAL pada atribut class agar JSON tidak rusak. Teks biasa tidak perlu dibungkus.
16. Cetak tebal, miring, garis bawah, pangkat, dan indeks di dokumen dipertahankan dengan <b>, <i>, <u>, <sup>, <sub>.

ATURAN RUMUS (SANGAT PENTING)
17. Semua rumus matematika, fisika, dan kimia ditulis dalam LaTeX di antara tanda dolar: sebaris $...$, baris sendiri $$...$$.
   Contoh: $\\frac{a}{b}$, $x^{2}$, $\\sqrt{17}$, $5\\,\\text{m/s}$, $\\times$, $\\leq$, $\\alpha$.
   Kimia: $\\ce{H2O}$, $\\ce{2H2 + O2 -> 2H2O}$.
18. Karena ini JSON, SETIAP garis miring terbalik WAJIB ditulis dua kali: \\frac, \\sqrt, \\times, \\text, \\ce. Ini mutlak. Satu garis miring akan merusak rumus.
19. Jangan menulis rumus sebagai teks biasa seperti "sqrt17", "x^2", "a/b", "10 pangkat 3" tanpa tanda dolar. Angka biasa tanpa operasi (misalnya "25 soal", "tahun 2026") tidak perlu dolar.
20. Bilangan desimal Indonesia di dalam rumus ditulis dengan {,} contoh $1{,}5 \\times 10^{3}$. Di luar rumus tulis biasa "1,5".
21. Teks biasa di dalam rumus dibungkus \\text{...}, termasuk teks Arab.
22. Tanda kutip ganda di dalam isi teks ditulis \" agar JSON tetap valid.

ATURAN TEKS ARAB
23. Teks Arab (termasuk harakat: fathah, kasrah, dhammah, sukun, syaddah, tanwin) ditulis sebagai karakter Unicode Arab biasa, UTUH, dalam urutan logis (huruf pertama kata di kanan). Jangan memakai gambar, jangan transliterasi pengganti, jangan membalik urutan huruf, jangan memutus huruf.
24. Hasil salinan PDF kadang terbalik atau terputus-putus. Bila begitu, tulis ulang kata Arab itu dengan benar. Jangan menghilangkan harakat.
25. AYAT ATAU HADIS: ayat Al-Qur'an atau hadis beserta tulisan Latin dan terjemahannya digabung dalam SATU blok teks, dengan tiga bagian berurutan:
   a) teks Arab berharakat di dalam <div class='rata-kanan'>...</div>;
   b) tulisan Latin (transliterasi) dalam <i>...</i>, bila ada di dokumen;
   c) terjemahan SELALU dicetak tebal dalam <b>...</b>, termasuk keterangan sumber (surah dan ayat, atau perawi hadis).
   Bagian a, b, dan c dipisahkan <br><br>. Contoh satu blok:
   {"tipe":"teks","isi":"<div class='rata-kanan'>هُوَ الَّذِي جَعَلَ الشَّمْسَ ضِيَاءً وَالْقَمَرَ نُورًا</div><br><i>Huwal-lażī ja'alasy-syamsa ḍiyā'aw wal-qamara nūrā.</i><br><br><b>Artinya: Dialah yang menjadikan matahari bersinar dan bulan bercahaya. (QS. Yunus: 5)</b>"}
   Bila dokumen tidak memuat tulisan Latin atau terjemahan, lewati bagian itu. Jangan mengarang. Kalimat pengantar seperti "Allah berfirman:" tetap menjadi blok tersendiri di atasnya, dan teks soal berikutnya menjadi blok terpisah di bawahnya.

PEMERIKSAAN SEBELUM MENJAWAB
Sebelum mengeluarkan hasil, periksa dalam hati:
- Jumlah soal di JSON = jumlah soal di dokumen.
- Setiap tabel teks di dokumen menjadi <table> di dalam blok teks (bukan daftar atau teks biasa), dengan jumlah baris dan kolom yang sama.
- Semua "tipe" hanya pg, pgk, atau isian.
- pg memiliki tepat 1 kunci; pgk memiliki 1 atau lebih; semua huruf kunci ada di opsi.
- isian tidak punya "opsi".
- Tidak ada garis miring tunggal pada rumus (semua \\ ganda).
- Tidak ada koma berlebih di akhir, kutip tidak berpasangan, atau karakter enter di dalam string. JSON harus lolos validator.

JIKA HASIL TERLALU PANJANG
Bila batas keluaranmu tidak cukup untuk semua soal, keluarkan sebagian soal pertama sebagai JSON array yang LENGKAP dan valid (jangan terpotong di tengah), lalu pada baris terpisah setelah JSON tulis persis: "LANJUT: soal berikutnya dimulai dari nomor N" (N = nomor soal berikutnya). Saya akan membalas "lanjut", dan kamu mengeluarkan bagian berikutnya dalam array baru.

CATATAN AKHIR
Setelah JSON (di luar array), bila ada hal yang perlu diperiksa manusia, tulis satu baris terpisah diawali "CATATAN:" berisi nomor soal dan alasannya (kunci tidak ada di dokumen, opsi berupa gambar, tabel rumit, teks Arab meragukan). Bila tidak ada, jangan tulis apa pun.
````

## Alur import di admin

1. Admin memilih ujian di tab Soal, klik "Import JSON".
2. Salin prompt, kirim bersama PDF/Word ke AI mana pun, tempel atau unggah hasil JSON.
3. "Periksa" (dry run): ringkasan per tipe, daftar soal bergambar kosong, peringatan, pratinjau rumus.
4. Pilih mode "Tambahkan" atau "Ganti semua", klik "Impor". Mode "Ganti semua" meminta konfirmasi.
5. Isi gambar manual lewat editor soal yang ditandai.
