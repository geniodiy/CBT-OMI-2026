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
