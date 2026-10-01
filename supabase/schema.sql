-- =====================================================
-- Try Out OMI 2026 CBT (Genio Institute) - Skema Supabase
-- Jalankan di Supabase: SQL Editor > New query > Run
-- Aman dijalankan ulang (memakai IF NOT EXISTS).
-- =====================================================
create extension if not exists pgcrypto;

-- -----------------------------------------------------
-- UJIAN: satu baris = satu kontainer di beranda
-- -----------------------------------------------------
create table if not exists ujian (
  id            uuid primary key default gen_random_uuid(),
  nama          text not null,
  jenjang       text not null,                  -- MI / MTs / MA (bebas diketik admin)
  mapel         text not null,
  sesi          text,                           -- label opsional, contoh "Sesi 1"
  token         text not null,
  durasi_menit  int  not null default 60 check (durasi_menit > 0),
  aktif         boolean not null default true,  -- false = disembunyikan dari beranda
  acak_soal     boolean not null default false,
  acak_opsi     boolean not null default false,
  tampil_kunci  boolean not null default false, -- kunci tampil di hasil siswa
  catatan       text,                           -- catatan khusus admin di layar info sebelum mulai
  buka_at       timestamptz,                    -- cadangan untuk jadwal otomatis (belum dipakai)
  tutup_at      timestamptz,                    -- cadangan untuk jadwal otomatis (belum dipakai)
  created_at    timestamptz not null default now()
);

-- -----------------------------------------------------
-- SOAL
--   blok  : [{"tipe":"teks","isi":"<b>..</b> $x^2$"},{"tipe":"gambar","isi":"https://..."}]
--   opsi  : [{"k":"A","h":"..."},{"k":"B","h":"..."}]   ([] untuk isian)
--   kunci : ["B"] | ["A","C"] | ["12,5","12.5"]
-- -----------------------------------------------------
create table if not exists soal (
  id         uuid primary key default gen_random_uuid(),
  ujian_id   uuid not null references ujian(id) on delete cascade,
  urutan     int  not null default 0,
  tipe       text not null check (tipe in ('pg','pgk','isian')),
  blok       jsonb not null default '[]'::jsonb,
  opsi       jsonb not null default '[]'::jsonb,
  kunci      jsonb not null default '[]'::jsonb,
  bobot      numeric not null default 1 check (bobot > 0),
  created_at timestamptz not null default now()
);
create index if not exists soal_ujian_idx on soal(ujian_id, urutan);

-- -----------------------------------------------------
-- SESI: satu baris = satu percobaan siswa (sekaligus hasilnya)
--   jawaban: {"<soal_id>": ["B"]}  atau  {"<soal_id>": ["teks isian"]}
-- -----------------------------------------------------
create table if not exists sesi (
  id              uuid primary key default gen_random_uuid(),
  ujian_id        uuid not null references ujian(id) on delete cascade,
  nama            text not null,
  nomor_peserta   text,
  kelas           text,
  sekolah         text,
  mulai_at        timestamptz not null default now(),
  selesai_at      timestamptz,
  status          text not null default 'berjalan' check (status in ('berjalan','selesai')),
  benar           int,
  salah           int,
  kosong          int,
  skor            numeric,
  durasi_detik    int,
  jawaban         jsonb not null default '{}'::jsonb,
  terakhir_sinkron timestamptz
);
create index if not exists sesi_ujian_idx on sesi(ujian_id, status);
create index if not exists sesi_peserta_idx on sesi(ujian_id, lower(nama), nomor_peserta);

-- -----------------------------------------------------
-- VIEW: ujian + jumlah soal per tipe (untuk kontainer beranda dan tab Ujian admin)
-- Hanya dibaca dari server (service_role). Server WAJIB membuang kolom token
-- sebelum mengirim ke siswa.
-- -----------------------------------------------------
create or replace view ujian_ringkas as
select
  u.*,
  count(s.id)                                  as jumlah_soal,
  count(s.id) filter (where s.tipe = 'pg')     as n_pg,
  count(s.id) filter (where s.tipe = 'pgk')    as n_pgk,
  count(s.id) filter (where s.tipe = 'isian')  as n_isian
from ujian u
left join soal s on s.ujian_id = u.id
group by u.id;

revoke all on ujian_ringkas from anon, authenticated;

-- -----------------------------------------------------
-- KEAMANAN: RLS aktif tanpa policy.
-- Artinya hanya service_role (dipakai Apps Script) yang bisa baca/tulis.
-- Kunci service_role JANGAN pernah ada di file HTML/JS klien.
-- -----------------------------------------------------
alter table ujian enable row level security;
alter table soal  enable row level security;
alter table sesi  enable row level security;

-- -----------------------------------------------------
-- STORAGE: bucket publik (dibaca siapa saja, diunggah lewat Apps Script)
--   soal-img : gambar soal
--   aset     : logo dan aset tampilan (opsional)
-- -----------------------------------------------------
insert into storage.buckets (id, name, public)
values ('soal-img', 'soal-img', true), ('aset', 'aset', true)
on conflict (id) do nothing;
