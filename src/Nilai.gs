/**
 * Logika murni penilaian dan normalisasi soal.
 * Tanpa ketergantungan Apps Script supaya bisa diuji dengan Node.
 */

var TIPE_ALIAS_ = {
  'pg': 'pg', 'pilihan ganda': 'pg',
  'pgk': 'pgk', 'pg kompleks': 'pgk',
  'isian': 'isian', 'isian singkat': 'isian'
};
var HURUF_OPSI_ = 'ABCDEFGH';
var KATA_LATEX_ = ['sqrt', 'frac', 'alpha', 'beta', 'gamma', 'theta', 'times', 'leq', 'geq', 'neq', 'cdot', 'infty', 'pm'];

/** Hapus karakter kendali arah tersembunyi dan ubah bentuk presentasi Arab (hasil salin PDF) ke huruf dasar. */
function normArab_(teks) {
  var s = String(teks == null ? '' : teks);
  s = s.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
  if (typeof s.normalize === 'function') {
    s = s.replace(/[\uFB50-\uFDFF\uFE70-\uFEFF]+/g, function (m) { return m.normalize('NFKC'); });
  }
  return s;
}

/** Bentuk pembanding jawaban isian: huruf kecil, spasi tunggal, koma jadi titik, Arab tanpa harakat dan tatwil. */
function norm_(teks) {
  var s = normArab_(teks);
  s = s.replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); });
  s = s.replace(/[\u064B-\u065F\u0670\u0640]/g, '');
  s = s.replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627')
       .replace(/\u0649/g, '\u064A')
       .replace(/\u0629/g, '\u0647');
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/,/g, '.');
}

function isNumber_(s) {
  return /^-?\d+(\.\d+)?$/.test(s);
}

/** Apakah jawaban (array string) benar untuk satu soal. */
function cek_(soal, jawaban) {
  var j = Array.isArray(jawaban) ? jawaban : [];
  var kunci = Array.isArray(soal.kunci) ? soal.kunci : [];
  if (soal.tipe === 'pg') {
    return j.length === 1 && j[0] === kunci[0];
  }
  if (soal.tipe === 'pgk') {
    if (!j.length) return false;
    var a = uniq_(j), b = uniq_(kunci);
    return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; });
  }
  var n = norm_(j[0]);
  if (!n) return false;
  return kunci.some(function (k) {
    var nk = norm_(k);
    return nk === n || (isNumber_(n) && isNumber_(nk) && Number(n) === Number(nk));
  });
}

function uniq_(arr) {
  return arr.filter(function (x, i) { return arr.indexOf(x) === i; });
}

function kosong_(jawaban) {
  if (!Array.isArray(jawaban) || !jawaban.length) return true;
  return jawaban.every(function (x) { return String(x == null ? '' : x).trim() === ''; });
}

function bulat2_(x) { return Math.round(x * 100) / 100; }
function bobotSoal_(soal) { return Number(soal.bobot) > 0 ? Number(soal.bobot) : 1; }
/** Nilai maksimum yang bisa diperoleh = jumlah bobot semua soal yang tampil. */
function bobotTotal_(daftarSoal) { return bulat2_((daftarSoal || []).reduce(function (t, s) { return t + bobotSoal_(s); }, 0)); }

/**
 * Menilai semua soal. poin = jumlah bobot soal benar, maks = jumlah bobot seluruh soal (dua desimal).
 * skor = poin / maks x 100 tetap dihitung sebagai persen internal (untuk urutan dan sebaran); yang ditampilkan ke pengguna adalah poin/maks.
 * rincian.kunci selalu terisi di sini; pemanggil membuangnya bila tampil_kunci = false.
 */
function hitung_(daftarSoal, jawaban) {
  var semua = jawaban || {};
  var benar = 0, salah = 0, kosong = 0, bobotBenar = 0, bobotTotal = 0;
  var rincian = daftarSoal.map(function (soal) {
    var bobot = bobotSoal_(soal);
    var j = semua[soal.id];
    var status;
    bobotTotal += bobot;
    if (kosong_(j)) { status = 'kosong'; kosong++; }
    else if (cek_(soal, j)) { status = 'benar'; benar++; bobotBenar += bobot; }
    else { status = 'salah'; salah++; }
    return { id: soal.id, status: status, jawaban: Array.isArray(j) ? j : [], kunci: soal.kunci || [] };
  });
  var skor = bobotTotal ? Math.round(bobotBenar / bobotTotal * 10000) / 100 : 0;
  return { benar: benar, salah: salah, kosong: kosong, skor: skor, poin: bulat2_(bobotBenar), maks: bulat2_(bobotTotal), rincian: rincian };
}

/** Awali pesan dengan "Soal #N: " bila i diberikan (import); tanpa i (editor manual) kalimat dimulai huruf besar. */
function pesan_(i, teks) {
  return i ? 'Soal #' + i + ': ' + teks : teks.charAt(0).toUpperCase() + teks.slice(1);
}

function galatSoal_(i, pesan) {
  return new Error(pesan_(i, pesan));
}

/** Ukuran tampil gambar. Tanpa ukuran = ukuran asli (maksimal selebar kartu). */
var UKURAN_GAMBAR_ = ['kecil', 'sedang', 'besar', 'penuh'];

function bagianBlok_(x, i) {
  var blok = [];
  if (Array.isArray(x.blok)) {
    x.blok.forEach(function (b) {
      var t = b && String(b.tipe || '').toLowerCase().trim();
      if (t !== 'teks' && t !== 'gambar') throw galatSoal_(i, 'tipe bagian harus "teks" atau "gambar".');
      var item = { tipe: t, isi: t === 'teks' ? normArab_(b.isi) : String(b.isi == null ? '' : b.isi).trim() };
      var uk = t === 'gambar' && b.ukuran != null ? String(b.ukuran).toLowerCase().trim() : '';
      if (uk && UKURAN_GAMBAR_.indexOf(uk) >= 0) item.ukuran = uk;
      blok.push(item);
    });
  } else {
    blok.push({ tipe: 'teks', isi: normArab_(x.teks) });
    if (x.gambar != null) blok.push({ tipe: 'gambar', isi: String(x.gambar).trim() });
  }
  var adaTeks = blok.some(function (b) { return b.tipe === 'teks' && b.isi.trim() !== ''; });
  if (!adaTeks) throw galatSoal_(i, 'teks soal kosong.');
  return blok;
}

function bagianOpsi_(x, i) {
  var daftar = [];
  if (Array.isArray(x.opsi)) {
    x.opsi.forEach(function (h, n) { daftar.push({ k: HURUF_OPSI_.charAt(n), h: normArab_(h) }); });
  } else if (x.opsi && typeof x.opsi === 'object') {
    Object.keys(x.opsi).sort().forEach(function (k) { daftar.push({ k: k.toUpperCase().trim(), h: normArab_(x.opsi[k]) }); });
  }
  if (daftar.length < 2) throw galatSoal_(i, 'opsi kurang dari 2.');
  if (daftar.length > 8) throw galatSoal_(i, 'opsi lebih dari 8.');
  daftar.forEach(function (o, n) {
    if (HURUF_OPSI_.indexOf(o.k) < 0 || o.k.length !== 1) throw galatSoal_(i, 'huruf opsi "' + o.k + '" tidak valid (A sampai H).');
    if (daftar.findIndex(function (p) { return p.k === o.k; }) !== n) throw galatSoal_(i, 'huruf opsi ' + o.k + ' dipakai dua kali.');
  });
  return daftar;
}

function bagianKunci_(x, tipe, opsi, i) {
  var mentah = Array.isArray(x.kunci) ? x.kunci : (x.kunci == null ? [] : [x.kunci]);
  var kunci;
  if (tipe === 'isian') {
    kunci = [];
    mentah.forEach(function (k) {
      String(k == null ? '' : k).split('|').forEach(function (p) {
        p = normArab_(p).trim();
        if (p) kunci.push(p);
      });
    });
  } else {
    kunci = [];
    mentah.forEach(function (k) {
      String(k == null ? '' : k).split(/[,|]/).forEach(function (p) {
        p = p.trim().toUpperCase();
        if (p) kunci.push(p);
      });
    });
    kunci = uniq_(kunci);
  }
  if (!kunci.length) throw galatSoal_(i, 'kunci kosong.');
  if (tipe !== 'isian') {
    kunci.forEach(function (k) {
      if (!opsi.some(function (o) { return o.k === k; })) throw galatSoal_(i, 'kunci ' + k + ' tidak ada di daftar opsi.');
    });
    if (tipe === 'pg' && kunci.length !== 1) throw galatSoal_(i, 'pilihan ganda harus punya tepat satu kunci.');
  }
  return kunci;
}

/** Potong bagian rumus ($..$, $$..$$, \(..\), \[..\]) supaya sisanya bisa diperiksa sebagai teks biasa. */
function tanpaRumus_(teks) {
  return String(teks)
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/\\\[[\s\S]*?\\\]/g, ' ')
    .replace(/\\\([\s\S]*?\\\)/g, ' ')
    .replace(/\$(?:\\.|[^$\\])*\$/g, ' ');
}

function peringatanTeks_(teks, i) {
  var out = [];
  var tanpaEscape = String(teks).replace(/\\\$/g, '');
  if ((tanpaEscape.match(/\$/g) || []).length % 2 === 1) {
    out.push(pesan_(i, 'tanda $ tidak berpasangan.'));
  }
  var luar = tanpaRumus_(tanpaEscape).replace(/<[^>]*>/g, ' ');
  KATA_LATEX_.forEach(function (kata) {
    if (new RegExp('(^|[^A-Za-z])\\\\?' + kata + '(?![A-Za-z])').test(luar)) {
      out.push(pesan_(i, 'ada "' + kata + '" di luar rumus. Tulis dengan garis miring dan tanda $, contoh $\\' + kata + '{...}$.'));
    }
  });
  return out;
}

/**
 * Normalisasi dan validasi satu soal. i = nomor 1-based untuk pesan galat.
 * Mengembalikan { soal: {tipe, blok, opsi, kunci, bobot}, peringatan: [] }.
 */
function normSoal_(x, i) {
  if (!x || typeof x !== 'object') throw galatSoal_(i, 'bukan objek soal.');
  var tipe = TIPE_ALIAS_[String(x.tipe == null ? '' : x.tipe).toLowerCase().trim().replace(/\s+/g, ' ')];
  if (!tipe) throw galatSoal_(i, 'tipe tidak dikenal. Gunakan pg, pgk, atau isian.');
  var peringatan = [];

  var blok = bagianBlok_(x, i);
  var opsi = tipe === 'isian' ? [] : bagianOpsi_(x, i);
  var kunci = bagianKunci_(x, tipe, opsi, i);

  var bobot = Number(x.bobot);
  if (x.bobot == null || x.bobot === '') bobot = 1;
  else if (!(bobot > 0)) { peringatan.push(pesan_(i, 'bobot tidak valid, dipakai 1.')); bobot = 1; }

  var teksSemua = blok.filter(function (b) { return b.tipe === 'teks'; }).map(function (b) { return b.isi; });
  opsi.forEach(function (o) { teksSemua.push(o.h); });
  teksSemua.forEach(function (t) { peringatan = peringatan.concat(peringatanTeks_(t, i)); });

  var panjang = blok.filter(function (b) { return b.tipe === 'teks'; })
    .map(function (b) { return b.isi.replace(/<[^>]*>/g, '').trim(); }).join('').length;
  if (panjang < 5) peringatan.push(pesan_(i, 'teks soal sangat pendek.'));

  (Array.isArray(x.blok) ? x.blok : []).forEach(function (b) {
    var uk = b && b.ukuran != null ? String(b.ukuran).toLowerCase().trim() : '';
    if (uk && String(b.tipe).toLowerCase().trim() === 'gambar' && UKURAN_GAMBAR_.indexOf(uk) < 0) {
      peringatan.push(pesan_(i, 'ukuran gambar "' + b.ukuran + '" tidak dikenal (gunakan kecil, sedang, besar, atau penuh); dipakai ukuran asli.'));
    }
  });
  blok.forEach(function (b) {
    if (b.tipe === 'gambar' && b.isi && !/^https:\/\//i.test(b.isi)) {
      peringatan.push(pesan_(i, 'URL gambar harus diawali https://.'));
    }
  });

  return { soal: { tipe: tipe, blok: blok, opsi: opsi, kunci: kunci, bobot: bobot }, peringatan: uniq_(peringatan) };
}

/**
 * Validasi dan bersihkan isian ujian dari admin. Hanya kolom yang diizinkan yang lolos.
 * Mengembalikan objek siap simpan; melempar Error berbahasa Indonesia.
 */
function normUjian_(u) {
  if (!u || typeof u !== 'object') throw new Error('Data ujian tidak valid.');
  function teks(v) { return String(v == null ? '' : v).trim(); }
  var nama = teks(u.nama), jenjang = teks(u.jenjang), mapel = teks(u.mapel), token = teks(u.token);
  if (!nama) throw new Error('Nama ujian wajib diisi.');
  if (!jenjang) throw new Error('Jenjang wajib diisi.');
  if (!mapel) throw new Error('Mata pelajaran wajib diisi.');
  if (!token) throw new Error('Token wajib diisi.');
  if (nama.length > 150) throw new Error('Nama ujian maksimal 150 karakter.');
  var durasi = Number(u.durasi_menit);
  if (!isFinite(durasi) || durasi < 1 || Math.floor(durasi) !== durasi) {
    throw new Error('Durasi harus berupa bilangan bulat minimal 1 menit.');
  }
  function waktu(v, label) {
    var t = teks(v);
    if (!t) return null;
    var ms = Date.parse(t);
    if (isNaN(ms)) throw new Error(label + ' tidak valid.');
    return new Date(ms).toISOString();
  }
  var buka = waktu(u.buka_at, 'Waktu buka'), tutup = waktu(u.tutup_at, 'Waktu tutup');
  if (buka && tutup && Date.parse(tutup) <= Date.parse(buka)) throw new Error('Waktu tutup harus setelah waktu buka.');
  return {
    nama: nama,
    jenjang: jenjang,
    mapel: mapel,
    sesi: teks(u.sesi) || null,
    token: token,
    buka_at: buka,
    tutup_at: tutup,
    durasi_menit: durasi,
    aktif: u.aktif === true,
    acak_soal: u.acak_soal === true,
    acak_opsi: u.acak_opsi === true,
    tampil_kunci: u.tampil_kunci === true,
    catatan: teks(u.catatan) || null
  };
}

/**
 * Susunan urutan baru. ada = [{id, urutan}] dari database, ids = urutan id yang diinginkan.
 * Id tak dikenal diabaikan; soal yang tidak disebut ditaruh di akhir. Hanya yang berubah dikembalikan.
 */
function urutanBerubah_(ada, ids) {
  var sekarang = {};
  ada.forEach(function (r) { sekarang[r.id] = r.urutan; });
  var susunan = uniq_((ids || []).filter(function (id) { return sekarang.hasOwnProperty(id); }));
  ada.slice().sort(function (a, b) { return a.urutan - b.urutan; }).forEach(function (r) {
    if (susunan.indexOf(r.id) < 0) susunan.push(r.id);
  });
  var out = [];
  susunan.forEach(function (id, n) {
    if (sekarang[id] !== n + 1) out.push({ id: id, urutan: n + 1 });
  });
  return out;
}

/**
 * Validasi seluruh daftar import. Daftar boleh array atau {soal: [...]}.
 * Galat pertama menghentikan dengan pesan "Soal #N: ...".
 * Mengembalikan { soal: [normalisasi], peringatan, per_tipe, gambar_kosong: [nomor 1-based] }.
 */
function ringkasImport_(daftar) {
  var arr = Array.isArray(daftar) ? daftar : (daftar && Array.isArray(daftar.soal) ? daftar.soal : null);
  if (!arr) throw new Error('Isi import harus berupa daftar soal (array JSON) atau objek {"soal": [...]}.');
  if (!arr.length) throw new Error('Daftar soal kosong.');
  var out = { soal: [], peringatan: [], per_tipe: { pg: 0, pgk: 0, isian: 0 }, gambar_kosong: [] };
  arr.forEach(function (x, n) {
    var r = normSoal_(x, n + 1);
    out.soal.push(r.soal);
    out.peringatan = out.peringatan.concat(r.peringatan);
    out.per_tipe[r.soal.tipe]++;
    if (r.soal.blok.some(function (b) { return b.tipe === 'gambar' && b.isi === ''; })) out.gambar_kosong.push(n + 1);
  });
  return out;
}

var URUTAN_JENJANG_ = ['mi', 'mts', 'ma'];

/** Urut kontainer beranda: MI, MTs, MA dulu, jenjang lain abjad; lalu mapel; lalu nama. Mengembalikan salinan. */
function urutKontainer_(daftar) {
  function peringkat(j) {
    var i = URUTAN_JENJANG_.indexOf(String(j || '').toLowerCase().trim());
    return i < 0 ? URUTAN_JENJANG_.length : i;
  }
  function banding(a, b) { return String(a || '').localeCompare(String(b || ''), 'id', { sensitivity: 'base' }); }
  return daftar.slice().sort(function (x, y) {
    return (peringkat(x.jenjang) - peringkat(y.jenjang)) ||
      (peringkat(x.jenjang) === URUTAN_JENJANG_.length ? banding(x.jenjang, y.jenjang) : 0) ||
      banding(x.mapel, y.mapel) || banding(x.nama, y.nama);
  });
}

/** Token dibandingkan tanpa peka huruf besar/kecil dan tanpa spasi di ujung. */
function tokenCocok_(a, b) {
  var x = String(a == null ? '' : a).trim().toLowerCase();
  return x !== '' && x === String(b == null ? '' : b).trim().toLowerCase();
}

/** Soal dengan bagian gambar yang masih kosong tidak ditampilkan dan tidak dinilai. */
function soalTampil_(baris) {
  return baris.filter(function (r) {
    return !(r.blok || []).some(function (b) { return b.tipe === 'gambar' && !String(b.isi || '').trim(); });
  });
}

/** Bersihkan jawaban dari klien: hanya {id: [teks]} dengan batas ukuran; jawaban kosong dibuang. */
function bersihJawaban_(j) {
  var out = {};
  if (!j || typeof j !== 'object' || Array.isArray(j)) return out;
  Object.keys(j).slice(0, 1000).forEach(function (id) {
    if (id.length > 64 || !Array.isArray(j[id])) return;
    var a = j[id].slice(0, 8).map(function (x) { return String(x == null ? '' : x).slice(0, 500); })
      .filter(function (x) { return x.trim() !== ''; });
    if (a.length) out[id] = a;
  });
  return out;
}

/** Data peserta dari klien. Nama wajib. */
function normPeserta_(p) {
  function t(v) { return String(v == null ? '' : v).trim().slice(0, 100); }
  var o = { nama: t(p && p.nama), nomor: t(p && p.nomor), kelas: t(p && p.kelas), sekolah: t(p && p.sekolah) };
  if (!o.nama) throw new Error('Nama peserta wajib diisi.');
  return o;
}

var BULAN_ID_ = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** "1 Oktober 2026, 08.00 WIB" dari milidetik UTC (zona waktu proyek Asia/Jakarta = UTC+7). */
function formatWaktu_(ms) {
  var d = new Date(ms + 7 * 3600000);
  function dua(n) { return (n < 10 ? '0' : '') + n; }
  return d.getUTCDate() + ' ' + BULAN_ID_[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + ', ' + dua(d.getUTCHours()) + '.' + dua(d.getUTCMinutes()) + ' WIB';
}

/** 'belum' sebelum buka_at, 'tutup' sejak tutup_at, selain itu 'buka'. Tanpa jadwal = selalu 'buka'. */
function statusJadwal_(u, sekarang) {
  var b = u.buka_at ? Date.parse(u.buka_at) : NaN, t = u.tutup_at ? Date.parse(u.tutup_at) : NaN;
  if (!isNaN(b) && sekarang < b) return 'belum';
  if (!isNaN(t) && sekarang >= t) return 'tutup';
  return 'buka';
}

/** Token acak 6 karakter tanpa huruf/angka yang mudah tertukar (0, O, 1, I). */
function tokenAcak_(n) {
  var abjad = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', t = '';
  for (var i = 0; i < (n || 6); i++) t += abjad.charAt(Math.floor(Math.random() * abjad.length));
  return t;
}
