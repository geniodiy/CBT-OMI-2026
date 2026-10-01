function doGet() {
  var t = HtmlService.createTemplateFromFile('Index');
  t.logoBase = prop_('SUPABASE_URL').replace(/\/+$/, '') + '/storage/v1/object/public/aset/';
  // Daftar ujian disisipkan ke halaman pertama; < dan pemisah baris diloloskan agar aman di dalam <script>.
  t.dataAwal = JSON.stringify(dataAwal_()).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return t.evaluate()
    .setTitle('Try Out OMI 2026 CBT')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(nama) {
  return HtmlService.createHtmlOutputFromFile(nama).getContent();
}
