/** Fungsi publik siswa (tanpa autentikasi). Jangan pernah mengirim kolom token atau kunci. */

var KOLOM_KONTAINER_ = 'id,nama,jenjang,mapel,sesi,durasi_menit,jumlah_soal,n_pg,n_pgk,n_isian';
var CACHE_BERANDA_DETIK_ = 60;

function apiBeranda() {
  var cache = CacheService.getScriptCache();
  var ada = cache.get(CACHE_BERANDA_);
  if (ada) return JSON.parse(ada);
  var baris = sb_('GET', 'ujian_ringkas?select=' + KOLOM_KONTAINER_ + '&aktif=eq.true') || [];
  var hasil = urutKontainer_(baris);
  try { cache.put(CACHE_BERANDA_, JSON.stringify(hasil), CACHE_BERANDA_DETIK_); } catch (e) { /* terlalu besar: lewati cache */ }
  return hasil;
}

function apiCekToken(ujianId, token) {
  var u = ujianDiBuka_(ujianId, token);
  return { ujian: u };
}

/** Ujian aktif + token cocok + punya soal. Hasil tanpa token. Dipakai juga oleh apiMulai (M6). */
function ujianDiBuka_(ujianId, token) {
  var baris = sb_('GET', 'ujian_ringkas?select=' + KOLOM_KONTAINER_ + ',token,catatan,acak_soal,acak_opsi&aktif=eq.true&id=eq.' + enc_(ujianId || ''));
  if (!baris || !baris.length) throw new Error('Ujian tidak ditemukan atau belum dibuka.');
  var u = baris[0];
  if (!tokenCocok_(token, u.token)) {
    Utilities.sleep(500);
    throw new Error('Token tidak cocok. Periksa kembali token dari pengawas.');
  }
  if (!u.jumlah_soal) throw new Error('Ujian ini belum memiliki soal.');
  delete u.token;
  return u;
}

// ---- Mengerjakan ujian ----

var SOAL_SISWA_ = 'id,tipe,blok,opsi';

function durasiUjian_(ujianId) {
  var cache = CacheService.getScriptCache();
  var ada = cache.get('dur_' + ujianId);
  if (ada) return Number(ada);
  var r = sb_('GET', 'ujian?select=durasi_menit&id=eq.' + enc_(ujianId));
  if (!r || !r.length) throw new Error('Ujian tidak ditemukan.');
  cache.put('dur_' + ujianId, String(r[0].durasi_menit), 600);
  return r[0].durasi_menit;
}

/** Sesi berjalan milik peserta yang sama (nama tanpa peka huruf + nomor sama) dan belum habis waktunya. */
function cariSesiBerjalan_(u, p, sekarang) {
  var baris = sb_('GET', 'sesi?select=id,nama,nomor_peserta,kelas,sekolah,mulai_at,jawaban&ujian_id=eq.' + enc_(u.id) +
    '&status=eq.berjalan&nama=ilike.' + enc_(p.nama) + '&order=mulai_at.desc&limit=20') || [];
  var nama = p.nama.toLowerCase(), nomor = p.nomor.toLowerCase();
  for (var i = 0; i < baris.length; i++) {
    var r = baris[i];
    if (String(r.nama).trim().toLowerCase() !== nama) continue;
    if (String(r.nomor_peserta || '').trim().toLowerCase() !== nomor) continue;
    if (Date.parse(r.mulai_at) + u.durasi_menit * 60000 <= sekarang) continue;
    return r;
  }
  return null;
}

function apiMulai(ujianId, token, peserta) {
  var p = normPeserta_(peserta);
  var u = ujianDiBuka_(ujianId, token);
  var sekarang = Date.now();
  var sesi = cariSesiBerjalan_(u, p, sekarang);
  var lanjut = !!sesi;
  if (!sesi) {
    sesi = sb_('POST', 'sesi', {
      ujian_id: u.id, nama: p.nama, nomor_peserta: p.nomor || null, kelas: p.kelas || null,
      sekolah: p.sekolah || null, mulai_at: new Date(sekarang).toISOString()
    })[0];
  }
  var baris = soalTampil_(sb_('GET', 'soal?select=' + SOAL_SISWA_ + '&ujian_id=eq.' + enc_(u.id) + '&order=urutan.asc,created_at.asc') || []);
  if (!baris.length) throw new Error('Ujian ini belum memiliki soal yang siap dikerjakan.');
  if (u.acak_soal) baris = seedShuffle_(baris, sesi.id);
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

function apiSelesai(sesiId, jawaban) {
  var sesiRows = sb_('GET', 'sesi?id=eq.' + enc_(sesiId));
  if (!sesiRows || !sesiRows.length) throw new Error('Sesi tidak ditemukan.');
  var sesi = sesiRows[0];
  var ke = sbBatch_([
    { method: 'GET', path: 'ujian?select=nama,jenjang,mapel,sesi,durasi_menit,tampil_kunci&id=eq.' + enc_(sesi.ujian_id) },
    { method: 'GET', path: 'soal?ujian_id=eq.' + enc_(sesi.ujian_id) + '&order=urutan.asc,created_at.asc' }
  ]);
  var u = ke[0] && ke[0][0];
  if (!u) throw new Error('Ujian tidak ditemukan.');
  var soal = soalTampil_(ke[1] || []);
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
    rincian: h.rincian.map(function (r) {
      return { id: r.id, status: r.status, jawaban: r.jawaban, kunci: u.tampil_kunci === true ? r.kunci : null };
    })
  };
}
