// Uji logika murni Nilai.gs. Jalankan: node tests/nilai.test.js
const fs=require("fs");const vm=require("vm");const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require("path").join(__dirname,"..","src","Nilai.gs"),"utf8"),ctx);global.T=ctx;
const {norm_,cek_,hitung_,normSoal_,normArab_}=T;const a=require('assert');
const s=[{id:'a',tipe:'pg',kunci:['C']},{id:'b',tipe:'pgk',kunci:['A','C']},{id:'c',tipe:'isian',kunci:['12,5']},{id:'d',tipe:'isian',kunci:['12.5']},{id:'e',tipe:'pg',kunci:['B']},{id:'f',tipe:'pgk',kunci:['A','C']},{id:'g',tipe:'isian',kunci:['x']}];
const h=hitung_(s,{a:['C'],b:['A'],c:['12.50'],d:['12,5'],f:['C','A'],g:['  ']});
a.strictEqual(JSON.stringify([h.benar,h.salah,h.kosong]),JSON.stringify([4,1,2]));a.strictEqual(h.benar+h.salah+h.kosong,s.length);
a(cek_({tipe:'isian',kunci:['كِتَابٌ']},['كتاب']));a(cek_({tipe:'isian',kunci:['أحمد']},['احمد']));
a.strictEqual(norm_('١٢,٥'),'12.5');
a.strictEqual(normArab_('‏abc'),'abc');a.strictEqual(normArab_('ﻣﺣﻤﺩ'),'محمد');
let r=normSoal_({tipe:'Pilihan Ganda',teks:'Hitung 10sqrt17 dan $x$',opsi:['1','2'],kunci:'b'},1);
a.strictEqual(JSON.stringify(r.soal.kunci),JSON.stringify(['B']));a(r.peringatan.some(p=>p.includes('sqrt')));
a.throws(()=>normSoal_({tipe:'pg',teks:'abcdef',opsi:['1','2'],kunci:['C']},3),/Soal #3: kunci C/);
a.throws(()=>normSoal_({tipe:'xx',teks:'a'},2),/Soal #2: tipe/);
a.throws(()=>normSoal_({tipe:'pg',teks:'',opsi:['1','2'],kunci:['A']},4),/teks soal kosong/);
a.throws(()=>normSoal_({tipe:'pg',teks:'abcdef',opsi:['1'],kunci:['A']},4),/opsi kurang/);
a.throws(()=>normSoal_({tipe:'pg',teks:'abcdef',opsi:['1','2'],kunci:['A','B']},4),/tepat satu/);
r=normSoal_({tipe:'isian',teks:'Hasil $\\frac{1}{2}$ adalah ...',kunci:'0,5 | 0.5',bobot:'x'},5);
a.strictEqual(JSON.stringify(r.soal.kunci),JSON.stringify(['0,5','0.5']));a(r.peringatan.some(p=>p.includes('bobot')));a(!r.peringatan.some(p=>p.includes('frac')));
r=normSoal_({tipe:'pg',teks:'Apa arti كِتَابٌ ? $x',opsi:{A:'a',B:'b'},kunci:['A']},6);a(r.peringatan.some(p=>p.includes('$')));
console.log('semua uji lulus');
{const n=ctx.normUjian_;const ok={nama:' A ',jenjang:'MA',mapel:'Mat',token:' ab12 ',durasi_menit:60,aktif:true,id:'x',hack:1};
const r=n(ok);a.strictEqual(r.nama,'A');a.strictEqual(r.token,'ab12');a.strictEqual(r.sesi,null);a.strictEqual(r.aktif,true);a.strictEqual(r.tampil_kunci,false);a(!('id' in r)&&!('hack' in r));
a.throws(()=>n({...ok,nama:''}),/Nama ujian wajib/);a.throws(()=>n({...ok,token:' '}),/Token wajib/);a.throws(()=>n({...ok,durasi_menit:0}),/Durasi/);a.throws(()=>n({...ok,durasi_menit:1.5}),/Durasi/);
console.log('uji ujian lulus');}
{const u=ctx.urutanBerubah_;const ada=[{id:'a',urutan:1},{id:'b',urutan:2},{id:'c',urutan:3}];
a.strictEqual(JSON.stringify(u(ada,['a','b','c'])),'[]');
a.strictEqual(JSON.stringify(u(ada,['b','a','c'])),JSON.stringify([{id:'b',urutan:1},{id:'a',urutan:2}]));
a.strictEqual(JSON.stringify(u(ada,['c','x','c'])),JSON.stringify([{id:'c',urutan:1},{id:'a',urutan:2},{id:'b',urutan:3}]));
let e;try{ctx.normSoal_({tipe:'pg',teks:'abcdef',opsi:['1','2'],kunci:[]},0)}catch(x){e=x.message}a.strictEqual(e,'Kunci kosong.');
console.log('uji urutan lulus');}
{const fs2=require('fs');const d=JSON.parse(fs2.readFileSync(require('path').join(__dirname,'..','contoh','soal-contoh.json'),'utf8'));
const r=ctx.ringkasImport_(d);a.strictEqual(r.soal.length,6);a.strictEqual(JSON.stringify(r.per_tipe),JSON.stringify({pg:2,pgk:2,isian:2}));a.strictEqual(JSON.stringify(r.gambar_kosong),'[2]');
const r2=ctx.ringkasImport_({soal:d});a.strictEqual(r2.soal.length,6);
a.throws(()=>ctx.ringkasImport_('x'),/array JSON/);a.throws(()=>ctx.ringkasImport_([]),/kosong/);
const bad=JSON.parse(JSON.stringify(d));bad[3].kunci=['Z'];a.throws(()=>ctx.ringkasImport_(bad),/Soal #4: kunci Z/);
console.log('peringatan contoh:',r.peringatan.length);console.log('uji import lulus');}
{const L=[{id:1,jenjang:'MA',mapel:'Fisika',nama:'B'},{id:2,jenjang:'SD',mapel:'IPA',nama:'A'},{id:3,jenjang:'MI',mapel:'Mat',nama:'Z'},{id:4,jenjang:'MTs',mapel:'IPA',nama:'A'},{id:5,jenjang:'ma',mapel:'Biologi',nama:'C'},{id:6,jenjang:'MI',mapel:'IPA',nama:'A'},{id:7,jenjang:'Adab',mapel:'x',nama:'a'}];
const o=ctx.urutKontainer_(L).map(x=>x.id);a.strictEqual(JSON.stringify(o),JSON.stringify([6,3,4,5,1,7,2]));
a(ctx.tokenCocok_(' ab12 ','AB12'));a(!ctx.tokenCocok_('','')) ;a(!ctx.tokenCocok_('x','y'));
console.log('uji beranda lulus');}

{const n=ctx.normUjian_;const ok={nama:'A',jenjang:'MA',mapel:'M',token:'t',durasi_menit:60};
const r=n({...ok,buka_at:'2026-10-01T01:00:00Z',tutup_at:'2026-10-01T03:00:00Z'});a.strictEqual(r.buka_at,'2026-10-01T01:00:00.000Z');
a.strictEqual(n(ok).buka_at,null);a.strictEqual(n({...ok,buka_at:''}).tutup_at,null);
a.throws(()=>n({...ok,buka_at:'bukan tanggal'}),/Waktu buka tidak valid/);
a.throws(()=>n({...ok,buka_at:'2026-10-01T03:00:00Z',tutup_at:'2026-10-01T03:00:00Z'}),/Waktu tutup harus setelah waktu buka/);
const t=Date.parse('2026-10-01T01:00:00Z');
a.strictEqual(ctx.formatWaktu_(t),'1 Oktober 2026, 08.00 WIB');a.strictEqual(ctx.formatWaktu_(Date.parse('2026-12-31T17:05:00Z')),'1 Januari 2027, 00.05 WIB');
const j={buka_at:'2026-10-01T01:00:00Z',tutup_at:'2026-10-01T03:00:00Z'};
a.strictEqual(ctx.statusJadwal_(j,t-1),'belum');a.strictEqual(ctx.statusJadwal_(j,t),'buka');a.strictEqual(ctx.statusJadwal_(j,t+2*3600000),'tutup');a.strictEqual(ctx.statusJadwal_({},t),'buka');a.strictEqual(ctx.statusJadwal_({buka_at:null,tutup_at:null},t),'buka');
a(/^[A-HJ-NP-Z2-9]{6}$/.test(ctx.tokenAcak_(6)));
console.log('uji jadwal lulus');}
