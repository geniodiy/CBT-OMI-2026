function doGet() {
  var t = HtmlService.createTemplateFromFile('Index');
  t.logoBase = prop_('SUPABASE_URL').replace(/\/+$/, '') + '/storage/v1/object/public/aset/';
  return t.evaluate()
    .setTitle('Try Out OMI 2026 CBT')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(nama) {
  return HtmlService.createHtmlOutputFromFile(nama).getContent();
}

// ---- Uji sementara M1 (jalankan dari editor Apps Script, hapus setelah M1 lulus) ----

function ujiM1Sb() {
  var r = sb_('GET', 'ujian?select=id&limit=1');
  Logger.log('Koneksi Supabase OK, baris: ' + JSON.stringify(r));
}

function ujiM1Hitung() {
  var soal = [
    { id: 'a', tipe: 'pg', kunci: ['C'], bobot: 1 },
    { id: 'b', tipe: 'pgk', kunci: ['A', 'C'], bobot: 1 },
    { id: 'c', tipe: 'isian', kunci: ['12,5'], bobot: 1 },
    { id: 'd', tipe: 'isian', kunci: ['12.5'], bobot: 1 },
    { id: 'e', tipe: 'pg', kunci: ['B'], bobot: 1 }
  ];
  var h = hitung_(soal, { a: ['C'], b: ['A'], c: ['12.50'], d: ['12,5'] });
  Logger.log(JSON.stringify(h)); // harapan: benar 3 (a,c,d), salah 1 (b), kosong 1 (e)
}
