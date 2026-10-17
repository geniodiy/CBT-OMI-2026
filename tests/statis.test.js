// Pemeriksaan statis aturan CLAUDE.md dan docs/UI.md. Jalankan: node tests/statis.test.js
const fs = require('fs'), path = require('path'), a = require('assert');
const src = path.join(__dirname, '..', 'src');
const baca = f => fs.readFileSync(path.join(src, f), 'utf8');
const gs = fs.readdirSync(src).filter(f => f.endsWith('.gs'));
const html = fs.readdirSync(src).filter(f => f.endsWith('.html'));
let gagal = 0;
function cek(nama, ok, detail) { if (!ok) { gagal++; console.log('GAGAL: ' + nama + (detail ? ' -> ' + detail : '')); } }

// Aturan 4: setiap fungsi admin* (kecuali adminLogin) memanggil guard_ di baris pertama.
const admin = baca('ApiAdmin.gs');
for (const m of admin.matchAll(/function (admin\w+)\([^)]*\) \{\n\s*(.*)/g)) {
  if (m[1] === 'adminLogin') continue;
  cek('guard_ di baris pertama ' + m[1], /^guard_\(tok\);/.test(m[2]), m[2]);
}

// Aturan 7: fungsi publik terdaftar di docs/API.md; helper privat berakhiran _.
const api = fs.readFileSync(path.join(__dirname, '..', 'docs', 'API.md'), 'utf8');
for (const f of ['ApiAdmin.gs', 'ApiSiswa.gs']) {
  for (const m of baca(f).matchAll(/^function (\w+)\(/gm)) {
    if (m[1].endsWith('_')) continue;
    cek('fungsi publik ' + m[1] + ' ada di docs/API.md', api.includes(m[1] + '('), '');
  }
}

// Aturan 1: kunci service_role tidak masuk berkas klien. Aturan 9: tanpa "<?" di JS klien, scriptlet hanya di Index.html.
for (const f of html) {
  const t = baca(f);
  cek('tanpa SUPABASE_KEY di ' + f, !/SUPABASE_KEY|service_role/.test(t));
  if (f !== 'Index.html') cek('tanpa scriptlet di ' + f, !t.includes('<?'));
}

// Aturan 5: innerHTML hanya dari clean() atau blokHTML(); selain itu textContent.
for (const f of html) {
  baca(f).split('\n').forEach((baris, i) => {
    if (/\.innerHTML\s*=/.test(baris) && !/clean\(|blokHTML\(/.test(baris) && !/innerHTML = ''/.test(baris)) {
      cek('innerHTML aman ' + f + ':' + (i + 1), false, baris.trim());
    }
  });
}

// docs/UI.md "Dilarang": gradien, kaca/blur, huruf kapital semua, panah di tombol, emoji.
const css = baca('Css.html');
// Pengecualian halaman ujian (docs/UI.md bagian 9): gradien hanya untuk latar ujian dan avatar.
let dalamLatar = false;
for (const baris of css.split('\n')) {
  if (/--latar-ujian:/.test(baris)) dalamLatar = true;
  if (/gradient/.test(baris)) cek('gradien hanya latar ujian/avatar/lapisan hero HP', dalamLatar || /--latar-ujian|\.u-avatar|\.hero::before/.test(baris), baris.trim());
  if (dalamLatar && /;\s*$/.test(baris)) dalamLatar = false;
  if (/box-shadow/.test(baris) || /--bayangan/.test(baris)) cek('bayangan bukan hitam pekat', !/rgba\(\s*0\s*,\s*0\s*,\s*0|#000\b/.test(baris), baris.trim());
  if (/text-transform:\s*uppercase/.test(baris)) cek('kapital semua hanya nama peserta', /\.u-nama/.test(baris), baris.trim());
}
cek('tanpa blur/kaca', !/blur\(|backdrop-filter/.test(css));
cek('gerak menghormati reduced-motion', /prefers-reduced-motion: reduce[^}]*animation: none/.test(css));
cek('tidak ada animation-fill-mode both pada panel/main ujian', !/\.ujian > \*[^}]*\bboth\b/.test(css));
for (const f of [...gs, ...html]) {
  const bad = baca(f).match(/[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u);
  cek('tanpa emoji atau panah di ' + f, !bad, bad && bad[0]);
}

// Library hanya dari cdnjs/Google Fonts dan dipin versinya.
const index = baca('Index.html');
for (const m of index.matchAll(/https:\/\/([^/"]+)\/[^"]*/g)) {
  cek('host library diizinkan: ' + m[1], ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(m[1]));
}
for (const v of ['KaTeX/0.16.9', 'dompurify/3.0.6']) cek('versi dipin ' + v, index.includes(v));
cek('versi dipin html2pdf.js/0.10.1', baca('JsCommon.html').includes('html2pdf.js/0.10.1'));

if (gagal) { console.log(gagal + ' pemeriksaan gagal.'); process.exit(1); }
console.log('pemeriksaan statis lulus');
