/** Fungsi publik siswa (tanpa autentikasi). Jangan pernah mengirim kolom token atau kunci. */

var KOLOM_KONTAINER_ = 'id,nama,jenjang,mapel,sesi,durasi_menit,jumlah_soal,n_pg,n_pgk,n_isian';
var CACHE_BERANDA_DETIK_ = 300;

/**
 * Baris ujian aktif beserta jadwalnya, disimpan di cache. Jadwal disaring saat disajikan (bukan saat disimpan),
 * jadi ujian tetap muncul atau hilang tepat waktu walau cache masih berlaku. Admin menghapus cache saat ada perubahan.
 */
function berandaMentah_() {
  var cache = CacheService.getScriptCache();
  var ada = cache.get(CACHE_BERANDA_);
  if (ada) return JSON.parse(ada);
  var baris = sb_('GET', 'ujian_ringkas?select=' + KOLOM_KONTAINER_ + ',buka_at,tutup_at&aktif=eq.true') || [];
  try { cache.put(CACHE_BERANDA_, JSON.stringify(baris), CACHE_BERANDA_DETIK_); } catch (e) { /* terlalu besar: lewati cache */ }
  return baris;
}

function apiBeranda() {
  var sekarang = Date.now();
  var buka = berandaMentah_().filter(function (u) { return statusJadwal_(u, sekarang) === 'buka'; })
    .map(function (u) { var c = Object.assign({}, u); delete c.buka_at; delete c.tutup_at; return c; });
  return urutKontainer_(buka);
}

function apiCekToken(ujianId, token) {
  var u = cekUjian_(ambilUjianRingkas_(ujianId), token);
  if (u.ditutup) throw new Error(pesanTutup_(u));
  delete u.ditutup; delete u.tutup_at;
  return { ujian: u };
}

function pesanTutup_(u) {
  return 'Ujian ini sudah ditutup pada ' + formatWaktu_(Date.parse(u.tutup_at)) + '.';
}

var KOLOM_UJIAN_SISWA_ = KOLOM_KONTAINER_ + ',token,catatan,acak_soal,acak_opsi,buka_at,tutup_at';

function pathUjianRingkas_(ujianId) {
  return 'ujian_ringkas?select=' + KOLOM_UJIAN_SISWA_ + '&aktif=eq.true&id=eq.' + enc_(ujianId || '');
}
function ambilUjianRingkas_(ujianId) {
  return sb_('GET', pathUjianRingkas_(ujianId));
}

/** Ujian aktif + token cocok + punya soal. Hasil tanpa token. baris = hasil query ujian_ringkas. */
function cekUjian_(baris, token) {
  if (!baris || !baris.length) throw new Error('Ujian tidak ditemukan atau belum dibuka.');
  var u = baris[0];
  if (!tokenCocok_(token, u.token)) {
    Utilities.sleep(500);
    throw new Error('Token tidak cocok. Periksa kembali token dari pengawas.');
  }
  var jadwal = statusJadwal_(u, Date.now());
  if (jadwal === 'belum') throw new Error('Ujian ini belum dibuka. Dibuka pada ' + formatWaktu_(Date.parse(u.buka_at)) + '.');
  if (!u.jumlah_soal) throw new Error('Ujian ini belum memiliki soal.');
  // Ujian yang sudah ditutup tidak menerima peserta baru, tetapi sesi yang sedang berjalan boleh dilanjutkan.
  u.ditutup = jadwal === 'tutup';
  delete u.token; delete u.buka_at;
  return u;
}

/** Data awal untuk halaman pertama (doGet) agar daftar ujian langsung tampil tanpa menunggu panggilan server. */
function dataAwal_() {
  try { return { beranda: apiBeranda() }; } catch (e) { Logger.log('Data awal dilewati: ' + e); return null; }
}

// ---- Mengerjakan ujian ----

var KOLOM_SOAL_ = 'id,urutan,tipe,blok,opsi,kunci,bobot,created_at';

/** Semua soal sebuah ujian (urut), termasuk kunci. Hanya untuk server; dibaca dari cache bila ada. */
function soalUjian_(ujianId) {
  var kunci = 'soal_' + versiSoal_() + '_' + ujianId;
  var ada = cacheGetBesar_(kunci);
  if (ada) return JSON.parse(ada);
  var baris = sb_('GET', 'soal?select=' + KOLOM_SOAL_ + '&ujian_id=eq.' + enc_(ujianId) + '&order=urutan.asc,created_at.asc') || [];
  cachePutBesar_(kunci, JSON.stringify(baris), 3600);
  return baris;
}

function durasiUjian_(ujianId) {
  var cache = CacheService.getScriptCache();
  var ada = cache.get('dur_' + ujianId);
  if (ada) return Number(ada);
  var r = sb_('GET', 'ujian?select=durasi_menit&id=eq.' + enc_(ujianId));
  if (!r || !r.length) throw new Error('Ujian tidak ditemukan.');
  cache.put('dur_' + ujianId, String(r[0].durasi_menit), 600);
  return r[0].durasi_menit;
}

function pathSesiBerjalan_(ujianId, nama) {
  return 'sesi?select=id,nama,nomor_peserta,kelas,sekolah,mulai_at,jawaban&ujian_id=eq.' + enc_(ujianId) +
    '&status=eq.berjalan&nama=ilike.' + enc_(nama) + '&order=mulai_at.desc&limit=20';
}

/** Sesi berjalan milik peserta yang sama (nama dan sekolah sama, tanpa peka huruf) dan belum habis waktunya. */
function pilihSesiBerjalan_(baris, durasiMenit, p, sekarang) {
  var nama = p.nama.toLowerCase(), sekolah = p.sekolah.toLowerCase();
  for (var i = 0; i < (baris || []).length; i++) {
    var r = baris[i];
    if (String(r.nama).trim().toLowerCase() !== nama) continue;
    if (String(r.sekolah || '').trim().toLowerCase() !== sekolah) continue;
    if (Date.parse(r.mulai_at) + durasiMenit * 60000 <= sekarang) continue;
    return r;
  }
  return null;
}

function apiMulai(ujianId, token, peserta) {
  var p = normPeserta_(peserta);
  // Ujian dan sesi lama dibaca bersamaan dalam satu putaran jaringan.
  var awal = sbBatch_([
    { method: 'GET', path: pathUjianRingkas_(ujianId) },
    { method: 'GET', path: pathSesiBerjalan_(ujianId, p.nama) }
  ]);
  var u = cekUjian_(awal[0], token);
  var sekarang = Date.now();
  var sesi = pilihSesiBerjalan_(awal[1], u.durasi_menit, p, sekarang);
  var lanjut = !!sesi;
  if (!sesi && u.ditutup) throw new Error(pesanTutup_(u));
  if (!sesi) {
    sesi = sb_('POST', 'sesi', {
      ujian_id: u.id, nama: p.nama, nomor_peserta: p.nomor || null, kelas: p.kelas || null,
      sekolah: p.sekolah || null, mulai_at: new Date(sekarang).toISOString()
    })[0];
  }
  var baris = soalTampil_(soalUjian_(u.id));
  if (!baris.length) throw new Error('Ujian ini belum memiliki soal yang siap dikerjakan.');
  if (u.acak_soal) baris = seedShuffle_(baris, sesi.id);
  // Hanya id, tipe, blok, opsi yang dikirim ke siswa. Kunci tidak pernah ikut.
  var soal = baris.map(function (s) {
    var opsi = s.opsi || [];
    if (u.acak_opsi && s.tipe !== 'isian') opsi = seedShuffle_(opsi, sesi.id + s.id);
    return { id: s.id, tipe: s.tipe, blok: s.blok, opsi: opsi };
  });
  return {
    sesiId: sesi.id, serverNow: sekarang, akhirMs: Date.parse(sesi.mulai_at) + u.durasi_menit * 60000,
    ujian: { nama: u.nama, jenjang: u.jenjang, mapel: u.mapel, sesi: u.sesi, durasi_menit: u.durasi_menit },
    peserta: { nama: sesi.nama, nomor: sesi.nomor_peserta || '', kelas: sesi.kelas || '', sekolah: sesi.sekolah || '' },
    soal: soal, jawaban: lanjut ? (sesi.jawaban || {}) : {}, lanjut: lanjut
  };
}

function apiSinkron(sesiId, jawaban) {
  var r = sb_('PATCH', 'sesi?select=mulai_at,ujian_id&id=eq.' + enc_(sesiId) + '&status=eq.berjalan',
    { jawaban: bersihJawaban_(jawaban), terakhir_sinkron: new Date().toISOString() });
  if (!r || !r.length) throw new Error('Sesi sudah selesai atau tidak ditemukan.');
  return { ok: true, serverNow: Date.now(), akhirMs: Date.parse(r[0].mulai_at) + durasiUjian_(r[0].ujian_id) * 60000 };
}

var KOLOM_UJIAN_HASIL_ = 'nama,jenjang,mapel,sesi,durasi_menit,tampil_kunci';

function apiSelesai(sesiId, jawaban) {
  // Sesi dan ujiannya dibaca sekaligus lewat relasi (satu panggilan).
  var sesiRows = sb_('GET', 'sesi?select=*,ujian(' + KOLOM_UJIAN_HASIL_ + ')&id=eq.' + enc_(sesiId));
  if (!sesiRows || !sesiRows.length) throw new Error('Sesi tidak ditemukan.');
  var sesi = sesiRows[0];
  var u = sesi.ujian;
  if (!u) {
    var cadangan = sb_('GET', 'ujian?select=' + KOLOM_UJIAN_HASIL_ + '&id=eq.' + enc_(sesi.ujian_id));
    u = cadangan && cadangan[0];
  }
  if (!u) throw new Error('Ujian tidak ditemukan.');
  var soal = soalTampil_(soalUjian_(sesi.ujian_id));
  var selesai = sesi.status === 'selesai';
  var pakai = selesai ? (sesi.jawaban || {}) : (jawaban == null ? (sesi.jawaban || {}) : bersihJawaban_(jawaban));
  var h = hitung_(soal, pakai);
  var selesaiAt = selesai ? sesi.selesai_at : new Date().toISOString();
  var durasi = selesai ? sesi.durasi_detik
    : Math.min(Math.max(0, Math.round((Date.parse(selesaiAt) - Date.parse(sesi.mulai_at)) / 1000)), u.durasi_menit * 60);
  if (!selesai) {
    sb_('PATCH', 'sesi?id=eq.' + enc_(sesiId) + '&status=eq.berjalan', {
      status: 'selesai', selesai_at: selesaiAt, benar: h.benar, salah: h.salah, kosong: h.kosong,
      skor: h.skor, durasi_detik: durasi, jawaban: pakai
    }, { Prefer: 'return=minimal' });
  }
  return {
    nama: sesi.nama, nomor: sesi.nomor_peserta || '', kelas: sesi.kelas || '', sekolah: sesi.sekolah || '',
    ujian: { nama: u.nama, jenjang: u.jenjang, mapel: u.mapel, sesi: u.sesi },
    selesaiAt: selesaiAt, durasi: durasi,
    benar: h.benar, salah: h.salah, kosong: h.kosong, total: soal.length, skor: h.skor,
    tampilKunci: u.tampil_kunci === true,
    rincian: h.rincian.map(function (r, n) {
      // Kunci isian tidak pernah dikirim; kunci pilihan ganda hanya bila tampil_kunci aktif.
      var tampil = u.tampil_kunci === true && soal[n].tipe !== 'isian';
      return { id: r.id, status: r.status, jawaban: r.jawaban, kunci: tampil ? r.kunci : null };
    })
  };
}
