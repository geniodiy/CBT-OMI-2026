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

**HTML yang diizinkan** (selain itu dibuang oleh DOMPurify): `b`, `strong`, `i`, `em`, `u`, `sub`, `sup`, `br`, `p`, `div`, `span`, `ul`, `ol`, `li`. Satu-satunya atribut yang lolos adalah `class` dengan nilai `rata-kiri`, `rata-tengah`, `rata-kanan`, atau `rata-penuh` (perataan teks dari editor; `rata-penuh` = rata kiri dan kanan/justify); nilai class lain dibuang, begitu juga `style` dan atribut lain.

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

Simpan sebagai konstanta di `JsAdmin.html` memakai `String.raw` agar garis miring ganda tidak hilang.

````text
Ubah soal pada dokumen terlampir menjadi JSON array dengan format di bawah.
Keluarkan HANYA JSON yang valid, tanpa penjelasan dan tanpa pagar kode.

Format tiap soal:
{
  "tipe": "pg" | "pgk" | "isian",
  "blok": [ {"tipe":"teks","isi":"..."}, {"tipe":"gambar","isi":""} ],
  "opsi": {"A":"...","B":"...","C":"...","D":"..."},
  "kunci": ["B"],
  "bobot": 1
}

Aturan:
1. pg = satu kunci, contoh ["B"]. pgk = satu atau lebih kunci, contoh ["A","C"].
   isian = tanpa "opsi"; "kunci" berisi semua jawaban yang diterima, contoh ["12,5","12.5"].
2. Teks boleh memakai HTML sederhana: <b>, <i>, <u>, <sub>, <sup>, <br>. Jangan pakai tag lain.
3. Semua rumus matematika, fisika, dan kimia ditulis dalam LaTeX di antara tanda dolar,
   contoh $\\frac{a}{b}$, $x^{2}$, $\\sqrt{17}$, $\\ce{H2O}$.
   Karena ini JSON, setiap garis miring terbalik WAJIB ditulis dua kali (\\frac, \\sqrt, \\ce).
   Jangan menulis rumus sebagai teks biasa seperti "sqrt17" atau "x^2" tanpa tanda dolar.
4. Jika soal punya gambar, tambahkan blok {"tipe":"gambar","isi":""} tepat di posisi gambar itu
   (di atas, tengah, atau bawah teks). Biarkan "isi" kosong. Gambar diisi manual di website.
5. Satu soal boleh memiliki beberapa blok teks dan beberapa blok gambar. Urutan blok mengikuti
   urutan tampil pada soal. Bagian "Pertanyaan" boleh menjadi blok teks tersendiri.
6. Pertahankan nomor, urutan, dan isi soal apa adanya. Jangan mengubah angka atau kata.
7. Teks Arab (termasuk harakat) ditulis sebagai karakter Unicode Arab biasa dalam urutan logis (kanan ke kiri saat dibaca), bukan gambar, bukan transliterasi, dan bukan urutan visual hasil salinan PDF.
8. Jika kunci jawaban tidak tertera di dokumen, isi dengan jawaban yang paling tepat menurut Anda;
   admin akan memeriksanya.
````

## Alur import di admin

1. Admin memilih ujian di tab Soal, klik "Import JSON".
2. Salin prompt, kirim bersama PDF/Word ke AI mana pun, tempel atau unggah hasil JSON.
3. "Periksa" (dry run): ringkasan per tipe, daftar soal bergambar kosong, peringatan, pratinjau rumus.
4. Pilih mode "Tambahkan" atau "Ganti semua", klik "Impor". Mode "Ganti semua" meminta konfirmasi.
5. Isi gambar manual lewat editor soal yang ditandai.
