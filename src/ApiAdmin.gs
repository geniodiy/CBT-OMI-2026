/** Fungsi publik admin. Setiap fungsi admin* memanggil guard_(tok) di baris pertama. */

var CACHE_BERANDA_ = 'beranda_v2';
var DURASI_SESI_ADMIN_DETIK_ = 6 * 60 * 60;

function adminLogin(password) {
  var benar = prop_('ADMIN_PASSWORD');
  if (String(password == null ? '' : password) !== benar) {
    Utilities.sleep(800);
    throw new Error('Kata sandi salah.');
  }
  var tok = Utilities.getUuid();
  CacheService.getScriptCache().put('adm_' + tok, '1', DURASI_SESI_ADMIN_DETIK_);
  // Daftar ujian ikut dikirim agar panel admin langsung terisi tanpa panggilan kedua.
  return { tok: tok, ujian: daftarUjianAdmin_() };
}

function adminKeluar(tok) {
  guard_(tok);
  CacheService.getScriptCache().remove('adm_' + tok);
  return true;
}

function adminUjianList(tok) {
  guard_(tok);
  return daftarUjianAdmin_();
}

/**
 * Daftar ujian untuk admin (view ujian_ringkas). Bila view belum diperbarui (kolom n_selesai/n_berjalan belum ada),
 * jumlah hasil dihitung dari tabel sesi supaya angka di panel tetap benar.
 */
function daftarUjianAdmin_() {
  var baris = sb_('GET', 'ujian_ringkas?select=*&order=created_at.desc') || [];
  if (!baris.length || baris[0].n_selesai !== undefined) return baris;
  var hitung = {};
  for (var mulai = 0, halaman = 0; halaman < 50; halaman++, mulai += 1000) {
    var s = sb_('GET', 'sesi?select=ujian_id,status&order=id.asc&limit=1000&offset=' + mulai) || [];
    s.forEach(function (x) {
      var h = hitung[x.ujian_id] || (hitung[x.ujian_id] = { selesai: 0, berjalan: 0 });
      if (x.status === 'selesai') h.selesai++; else h.berjalan++;
    });
    if (s.length < 1000) break;
  }
  baris.forEach(function (u) {
    var h = hitung[u.id] || { selesai: 0, berjalan: 0 };
    u.n_selesai = h.selesai; u.n_berjalan = h.berjalan;
  });
  return baris;
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
  bumpSoal_();
  return true;
}

/** Salin ujian beserta soalnya. Hasil siswa tidak disalin. Salinan nonaktif, bertoken baru, tanpa jadwal. */
function adminUjianDuplikat(tok, id, namaSalinan) {
  guard_(tok);
  var asal = sb_('GET', 'ujian?id=eq.' + enc_(id));
  if (!asal || !asal.length) throw new Error('Ujian tidak ditemukan. Mungkin sudah dihapus.');
  var u = asal[0];
  var baru = sb_('POST', 'ujian', {
    nama: String(namaSalinan || '').trim().slice(0, 150) || (String(u.nama).slice(0, 138) + ' (salinan)'), jenjang: u.jenjang, mapel: u.mapel, sesi: u.sesi,
    token: tokenAcak_(6), durasi_menit: u.durasi_menit, aktif: false, acak_soal: u.acak_soal, acak_opsi: u.acak_opsi,
    tampil_kunci: u.tampil_kunci, catatan: u.catatan, buka_at: null, tutup_at: null
  })[0];
  try {
    var soal = sb_('GET', 'soal?ujian_id=eq.' + enc_(id) + '&order=urutan.asc,created_at.asc') || [];
    var baris = soal.map(function (s) {
      return { ujian_id: baru.id, urutan: s.urutan, tipe: s.tipe, blok: s.blok, opsi: s.opsi, kunci: s.kunci, bobot: s.bobot };
    });
    for (var i = 0; i < baris.length; i += POTONGAN_INSERT_) {
      sb_('POST', 'soal', baris.slice(i, i + POTONGAN_INSERT_), { Prefer: 'return=minimal' });
    }
  } catch (e) {
    try { sb_('DELETE', 'ujian?id=eq.' + enc_(baru.id), null, { Prefer: 'return=minimal' }); } catch (e2) { Logger.log('Gagal membatalkan salinan: ' + e2); }
    throw e;
  }
  CacheService.getScriptCache().remove(CACHE_BERANDA_);
  return baru;
}

// ---- Soal ----

function adminSoalList(tok, ujianId) {
  guard_(tok);
  return sb_('GET', 'soal?ujian_id=eq.' + enc_(ujianId) + '&order=urutan.asc,created_at.asc') || [];
}

function adminSoalSimpan(tok, s) {
  guard_(tok);
  if (!s || (!s.id && !s.ujian_id)) throw new Error('Ujian belum dipilih.');
  var n = normSoal_(s, 0);
  var baris = { tipe: n.soal.tipe, blok: n.soal.blok, opsi: n.soal.opsi, kunci: n.soal.kunci, bobot: n.soal.bobot };
  var hasil;
  if (s.id) {
    hasil = sb_('PATCH', 'soal?id=eq.' + enc_(s.id), baris);
    if (!hasil || !hasil.length) throw new Error('Soal tidak ditemukan. Mungkin sudah dihapus.');
  } else {
    var akhir = sb_('GET', 'soal?select=urutan&ujian_id=eq.' + enc_(s.ujian_id) + '&order=urutan.desc&limit=1');
    baris.ujian_id = s.ujian_id;
    baris.urutan = (akhir && akhir.length ? akhir[0].urutan : 0) + 1;
    hasil = sb_('POST', 'soal', baris);
  }
  CacheService.getScriptCache().remove(CACHE_BERANDA_);
  bumpSoal_();
  return Object.assign({}, hasil[0], { peringatan: n.peringatan });
}

function adminSoalHapus(tok, id) {
  guard_(tok);
  if (!id) throw new Error('Soal tidak dipilih.');
  sb_('DELETE', 'soal?id=eq.' + enc_(id), null, { Prefer: 'return=minimal' });
  CacheService.getScriptCache().remove(CACHE_BERANDA_);
  bumpSoal_();
  return true;
}

function adminSoalUrut(tok, ujianId, idsBerurutan) {
  guard_(tok);
  var ada = sb_('GET', 'soal?select=id,urutan&ujian_id=eq.' + enc_(ujianId)) || [];
  var ubah = urutanBerubah_(ada, idsBerurutan);
  sbBatch_(ubah.map(function (u) {
    return { method: 'PATCH', path: 'soal?id=eq.' + enc_(u.id), body: { urutan: u.urutan } };
  }));
  bumpSoal_();
  return true;
}

// ---- Gambar ----

var MIME_GAMBAR_ = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
var MAKS_GAMBAR_BYTE_ = 3 * 1024 * 1024;

function adminUpload(tok, base64, mime, nama) {
  guard_(tok);
  var ext = MIME_GAMBAR_[mime];
  if (!ext) throw new Error('Format gambar harus PNG, JPG, WEBP, atau GIF.');
  var bersih = String(base64 || '').replace(/^data:[^,]*,/, '');
  var bytes = Utilities.base64Decode(bersih);
  if (!bytes.length) throw new Error('Berkas gambar kosong.');
  if (bytes.length > MAKS_GAMBAR_BYTE_) throw new Error('Gambar terlalu besar. Maksimal 3 MB.');
  var dasar = prop_('SUPABASE_URL').replace(/\/+$/, '');
  var kunci = prop_('SUPABASE_KEY');
  var jalur = Utilities.getUuid() + '.' + ext;
  var res = UrlFetchApp.fetch(dasar + '/storage/v1/object/soal-img/' + jalur, {
    method: 'post', contentType: mime, payload: bytes, muteHttpExceptions: true,
    headers: { apikey: kunci, Authorization: 'Bearer ' + kunci, 'x-upsert': 'false' }
  });
  if (res.getResponseCode() >= 300) {
    Logger.log('Upload gambar %s gagal -> %s %s', nama, res.getResponseCode(), res.getContentText());
    throw new Error('Gambar gagal diunggah (kode ' + res.getResponseCode() + '). Coba lagi.');
  }
  return dasar + '/storage/v1/object/public/soal-img/' + jalur;
}

// ---- Import JSON ----

var MAKS_SOAL_IMPORT_ = 300;
var POTONGAN_INSERT_ = 50;

function adminSoalImport(tok, ujianId, daftar, mode, dryRun) {
  guard_(tok);
  if (!ujianId) throw new Error('Ujian belum dipilih.');
  if (mode !== 'tambah' && mode !== 'ganti') throw new Error('Mode import harus "tambah" atau "ganti".');
  var r = ringkasImport_(daftar);
  if (r.soal.length > MAKS_SOAL_IMPORT_) throw new Error('Maksimal ' + MAKS_SOAL_IMPORT_ + ' soal sekali import.');
  var ringkas = {
    jumlah: r.soal.length, per_tipe: r.per_tipe, gambar_kosong: r.gambar_kosong, peringatan: r.peringatan,
    pratinjau: r.soal.slice(0, 10)
  };
  if (dryRun) return ringkas;

  // Soal baru dimasukkan lebih dulu; mode "ganti" baru menghapus yang lama setelah semuanya berhasil.
  var akhir = sb_('GET', 'soal?select=urutan&ujian_id=eq.' + enc_(ujianId) + '&order=urutan.desc&limit=1');
  var maksLama = akhir && akhir.length ? akhir[0].urutan : 0;
  var baris = r.soal.map(function (s, n) {
    return { ujian_id: ujianId, urutan: maksLama + n + 1, tipe: s.tipe, blok: s.blok, opsi: s.opsi, kunci: s.kunci, bobot: s.bobot };
  });
  for (var i = 0; i < baris.length; i += POTONGAN_INSERT_) {
    sb_('POST', 'soal', baris.slice(i, i + POTONGAN_INSERT_), { Prefer: 'return=minimal' });
  }
  if (mode === 'ganti' && maksLama > 0) {
    sb_('DELETE', 'soal?ujian_id=eq.' + enc_(ujianId) + '&urutan=lte.' + maksLama, null, { Prefer: 'return=minimal' });
  }
  CacheService.getScriptCache().remove(CACHE_BERANDA_);
  bumpSoal_();
  return ringkas;
}

// ---- Hasil ----

/** Hanya sesi selesai, tanpa kolom jawaban. Urut: nilai, benar terbanyak, salah tersedikit, waktu tercepat. */
function adminHasil(tok, ujianId) {
  guard_(tok);
  if (!ujianId) throw new Error('Ujian belum dipilih.');
  var baris = sb_('GET', 'sesi?select=id,nama,nomor_peserta,kelas,sekolah,benar,salah,kosong,skor,durasi_detik,selesai_at' +
    '&ujian_id=eq.' + enc_(ujianId) + '&status=eq.selesai&order=skor.desc,benar.desc,salah.asc,durasi_detik.asc') || [];
  // Nilai ditampilkan sebagai poin/maks (bukan per 100). skor tersimpan sebagai persen, jadi poin diturunkan dari skor dan maks.
  var maks = bobotTotal_(soalTampil_(soalUjian_(ujianId)));
  baris.forEach(function (r) { r.maks = maks; r.poin = maks ? bulat2_(Number(r.skor) * maks / 100) : 0; });
  return baris;
}

/** Rincian satu hasil: status tiap soal (nomor mengikuti urutan soal di tab Soal), jawaban siswa, dan kunci. */
function adminHasilDetail(tok, sesiId) {
  guard_(tok);
  if (!sesiId) throw new Error('Hasil tidak dipilih.');
  var r = sb_('GET', 'sesi?select=id,ujian_id,nama,nomor_peserta,kelas,sekolah,benar,salah,kosong,skor,durasi_detik,selesai_at,jawaban&id=eq.' + enc_(sesiId));
  if (!r || !r.length) throw new Error('Hasil tidak ditemukan. Mungkin sudah direset.');
  var sesi = r[0];
  var semua = soalUjian_(sesi.ujian_id);
  var h = hitung_(soalTampil_(semua), sesi.jawaban || {});
  var peta = {};
  h.rincian.forEach(function (x) { peta[x.id] = x; });
  var rincian = semua.map(function (x, i) {
    var d = peta[x.id];
    var status = d ? d.status : 'disembunyikan';
    return {
      no: i + 1, id: x.id, tipe: x.tipe, status: status,
      jawaban: d ? d.jawaban : [], kunci: x.kunci || [],
      // Teks soal hanya dikirim untuk yang salah atau kosong (untuk daftar "soal yang perlu dibahas").
      blok: status === 'salah' || status === 'kosong' ? (x.blok || []).filter(function (b) { return b.tipe === 'teks'; }) : []
    };
  });
  delete sesi.jawaban;
  sesi.poin = h.poin; sesi.maks = h.maks;
  var u = sb_('GET', 'ujian?select=nama,jenjang,mapel,sesi&id=eq.' + enc_(sesi.ujian_id));
  return { sesi: sesi, rincian: rincian, ujian: (u && u[0]) || { nama: '', jenjang: '', mapel: '', sesi: '' } };
}

function adminSesiHapus(tok, sesiId) {
  guard_(tok);
  if (!sesiId) throw new Error('Hasil tidak dipilih.');
  sb_('DELETE', 'sesi?id=eq.' + enc_(sesiId), null, { Prefer: 'return=minimal' });
  return true;
}
