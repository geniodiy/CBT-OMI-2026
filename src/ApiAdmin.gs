/** Fungsi publik admin. Setiap fungsi admin* memanggil guard_(tok) di baris pertama. */

var CACHE_BERANDA_ = 'beranda_v1';
var DURASI_SESI_ADMIN_DETIK_ = 6 * 60 * 60;

function adminLogin(password) {
  var benar = prop_('ADMIN_PASSWORD');
  if (String(password == null ? '' : password) !== benar) {
    Utilities.sleep(800);
    throw new Error('Kata sandi salah.');
  }
  var tok = Utilities.getUuid();
  CacheService.getScriptCache().put('adm_' + tok, '1', DURASI_SESI_ADMIN_DETIK_);
  return tok;
}

function adminKeluar(tok) {
  if (tok) CacheService.getScriptCache().remove('adm_' + tok);
  return true;
}

function adminUjianList(tok) {
  guard_(tok);
  return sb_('GET', 'ujian_ringkas?select=*&order=created_at.desc') || [];
}

function adminUjianSimpan(tok, u) {
  guard_(tok);
  var data = normUjian_(u);
  var hasil;
  if (u.id) {
    hasil = sb_('PATCH', 'ujian?id=eq.' + enc_(u.id), data);
    if (!hasil || !hasil.length) throw new Error('Ujian tidak ditemukan. Mungkin sudah dihapus.');
  } else {
    hasil = sb_('POST', 'ujian', data);
  }
  CacheService.getScriptCache().remove(CACHE_BERANDA_);
  return hasil[0];
}

function adminUjianHapus(tok, id) {
  guard_(tok);
  if (!id) throw new Error('Ujian tidak dipilih.');
  sb_('DELETE', 'ujian?id=eq.' + enc_(id), null, { Prefer: 'return=minimal' });
  CacheService.getScriptCache().remove(CACHE_BERANDA_);
  return true;
}
