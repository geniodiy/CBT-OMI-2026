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

## Mengerjakan dengan Claude Code

Buka folder ini di Claude Code. Ia membaca `CLAUDE.md` otomatis. Mulai dengan: "Kerjakan milestone M1 di TASKS.md."
