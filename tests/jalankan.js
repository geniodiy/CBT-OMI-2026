// Menjalankan semua uji tanpa dependensi: node tests/jalankan.js
const { spawnSync } = require('child_process');
let gagal = false;
for (const f of ['nilai.test.js', 'siswa.test.js', 'statis.test.js']) {
  console.log('== ' + f);
  const r = spawnSync(process.execPath, [require('path').join(__dirname, f)], { stdio: 'inherit' });
  if (r.status !== 0) gagal = true;
}
process.exit(gagal ? 1 : 0);
