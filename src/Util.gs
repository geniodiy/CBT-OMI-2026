/** Helper server. Fungsi berakhiran _ tidak bisa dipanggil dari klien. */

function prop_(nama) {
  var v = PropertiesService.getScriptProperties().getProperty(nama);
  if (!v) throw new Error('Pengaturan server belum lengkap: ' + nama + ' belum diisi di Script Properties.');
  return v;
}

function enc_(v) {
  return encodeURIComponent(String(v));
}

/**
 * Panggil REST Supabase. path contoh: 'ujian?select=id&limit=1'.
 * Mengembalikan JSON hasil (atau null jika badan kosong). Galat detail hanya masuk log.
 */
function sb_(method, path, body, extraHeaders) {
  var m = String(method || 'GET').toUpperCase();
  var headers = {
    apikey: prop_('SUPABASE_KEY'),
    Authorization: 'Bearer ' + prop_('SUPABASE_KEY')
  };
  if (m === 'POST' || m === 'PATCH') headers.Prefer = 'return=representation';
  Object.keys(extraHeaders || {}).forEach(function (k) { headers[k] = extraHeaders[k]; });

  var opt = { method: m.toLowerCase(), headers: headers, muteHttpExceptions: true };
  if (body !== undefined && body !== null) {
    opt.contentType = 'application/json; charset=utf-8';
    opt.payload = JSON.stringify(body);
  }
  var res = UrlFetchApp.fetch(prop_('SUPABASE_URL').replace(/\/+$/, '') + '/rest/v1/' + path, opt);
  var kode = res.getResponseCode();
  var teks = res.getContentText();
  if (kode >= 300) {
    Logger.log('Supabase %s %s -> %s %s', m, path, kode, teks);
    throw new Error('Database tidak dapat diakses (kode ' + kode + '). Coba lagi sebentar.');
  }
  return teks ? JSON.parse(teks) : null;
}

/** Beberapa panggilan REST sekaligus (fetchAll). daftar = [{method, path, body}]. Hasil: array JSON per permintaan. */
function sbBatch_(daftar) {
  var hasil = [];
  var kunci = prop_('SUPABASE_KEY'), dasar = prop_('SUPABASE_URL').replace(/\/+$/, '') + '/rest/v1/';
  for (var i = 0; i < daftar.length; i += 20) {
    var reqs = daftar.slice(i, i + 20).map(function (d) {
      var r = {
        url: dasar + d.path, method: String(d.method).toLowerCase(), muteHttpExceptions: true,
        headers: { apikey: kunci, Authorization: 'Bearer ' + kunci, Prefer: 'return=minimal' }
      };
      if (d.body !== undefined && d.body !== null) { r.contentType = 'application/json; charset=utf-8'; r.payload = JSON.stringify(d.body); }
      return r;
    });
    UrlFetchApp.fetchAll(reqs).forEach(function (res) {
      var kode = res.getResponseCode();
      if (kode >= 300) {
        Logger.log('Supabase batch -> %s %s', kode, res.getContentText());
        throw new Error('Database tidak dapat diakses (kode ' + kode + '). Coba lagi sebentar.');
      }
      var t = res.getContentText();
      hasil.push(t ? JSON.parse(t) : null);
    });
  }
  return hasil;
}

/** Wajib di baris pertama setiap fungsi admin*. */
function guard_(tok) {
  if (!tok || !CacheService.getScriptCache().get('adm_' + tok)) {
    throw new Error('SESI_ADMIN: masuk kembali');
  }
}

function shuffle_(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/** Acak yang hasilnya sama untuk seed yang sama (urutan soal tetap saat sesi dilanjutkan). */
function seedShuffle_(arr, seed) {
  var h = 1779033703 ^ String(seed).length;
  for (var n = 0; n < String(seed).length; n++) {
    h = Math.imul(h ^ String(seed).charCodeAt(n), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  var state = h >>> 0;
  function acak() {
    state = (state + 0x6D2B79F5) >>> 0;
    var t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(acak() * (i + 1));
    var x = a[i]; a[i] = a[j]; a[j] = x;
  }
  return a;
}

// ---- Cache server (CacheService) untuk data yang sering dibaca ----

var POTONGAN_CACHE_ = 30000; // karakter per kunci; nilai maksimum CacheService 100 KB (UTF-8, Arab bisa 3 byte per huruf)

/** Simpan string besar dengan memecahnya ke beberapa kunci. Gagal diam-diam bila cache menolak. */
function cachePutBesar_(kunci, teks, detik) {
  try {
    var cache = CacheService.getScriptCache(), n = Math.ceil(teks.length / POTONGAN_CACHE_) || 1, isi = {};
    for (var i = 0; i < n; i++) isi[kunci + '#' + i] = teks.substr(i * POTONGAN_CACHE_, POTONGAN_CACHE_);
    isi[kunci] = String(n);
    cache.putAll(isi, detik);
  } catch (e) { Logger.log('Cache besar dilewati: ' + e); }
}

/** Kembalikan string utuh, atau null bila ada potongan yang hilang. */
function cacheGetBesar_(kunci) {
  var cache = CacheService.getScriptCache(), n = Number(cache.get(kunci));
  if (!n) return null;
  var kunciPotongan = [];
  for (var i = 0; i < n; i++) kunciPotongan.push(kunci + '#' + i);
  var isi = cache.getAll(kunciPotongan), teks = '';
  for (var j = 0; j < n; j++) {
    var p = isi[kunci + '#' + j];
    if (p == null) return null;
    teks += p;
  }
  return teks;
}

/** Penanda versi soal. Berubah setiap soal diubah, sehingga cache soal lama otomatis tidak dipakai. */
function versiSoal_() {
  var cache = CacheService.getScriptCache(), v = cache.get('ver_soal');
  if (!v) { v = Utilities.getUuid(); cache.put('ver_soal', v, 21600); }
  return v;
}

function bumpSoal_() {
  CacheService.getScriptCache().put('ver_soal', Utilities.getUuid(), 21600);
}
