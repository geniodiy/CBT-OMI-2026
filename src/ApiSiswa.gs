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
  var baris = sb_('GET', 'ujian_ringkas?select=' + KOLOM_KONTAINER_ + ',token,catatan&aktif=eq.true&id=eq.' + enc_(ujianId || ''));
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
