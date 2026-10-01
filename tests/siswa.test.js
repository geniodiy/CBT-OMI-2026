// Uji ApiSiswa.gs dan hasil admin dengan Supabase tiruan (dalam memori). Jalankan: node tests/siswa.test.js
const fs=require('fs'),vm=require('vm'),a=require('assert');
const src=f=>fs.readFileSync(require('path').join(__dirname,'..','src',f),'utf8');
let uuid=0;const DB={ujian:[],soal:[],sesi:[]};
const clone=x=>x===undefined?x:JSON.parse(JSON.stringify(x));
function parse(path){const [t,q='']=path.split('?');const p={f:[]};q.split('&').filter(Boolean).forEach(kv=>{const i=kv.indexOf('=');const k=kv.slice(0,i),v=decodeURIComponent(kv.slice(i+1));
 if(k==='select')p.select=v.split(',');else if(k==='order')p.order=v;else if(k==='limit')p.limit=+v;else{const j=v.indexOf('.');p.f.push([k,v.slice(0,j),v.slice(j+1)])}});return [t,p]}
function match(r,[k,op,v]){const x=r[k];if(op==='eq')return String(x)===v;if(op==='lte')return Number(x)<=Number(v);
 if(op==='ilike'){const re=new RegExp('^'+v.replace(/[.+^${}()|[\]\\]/g,'\\$&').replace(/[*%]/g,'.*')+'$','i');return re.test(String(x))}return false}
function view(t){if(t!=='ujian_ringkas')return DB[t];return DB.ujian.map(u=>{const s=DB.soal.filter(x=>x.ujian_id===u.id);return {...u,jumlah_soal:s.length,n_pg:s.filter(x=>x.tipe==='pg').length,n_pgk:s.filter(x=>x.tipe==='pgk').length,n_isian:s.filter(x=>x.tipe==='isian').length}})}
function pick(r,sel){if(!sel)return clone(r);const o={};sel.forEach(c=>o[c]=clone(r[c]));return o}
const ctx={Date,Math,JSON,Number,String,Array,Object,parseInt,isNaN,Error,encodeURIComponent,console,
 Logger:{log(){}},Utilities:{sleep(){},getUuid:()=>'u'+(++uuid)},
 CacheService:{getScriptCache:()=>({_m:{},get(k){return this._m[k]||null},put(k,v){this._m[k]=v},remove(k){delete this._m[k]}})},
 PropertiesService:{getScriptProperties:()=>({getProperty:()=>'x'})}};
vm.createContext(ctx);
['Nilai.gs','Util.gs','ApiAdmin.gs','ApiSiswa.gs'].forEach(f=>vm.runInContext(src(f),ctx));
ctx.sb_=function(m,path,body){const [t,p]=parse(path);
 if(m==='GET'){let r=view(t).filter(x=>p.f.every(f=>match(x,f)));if(p.order){const ks=p.order.split(',').map(o=>o.split('.'));r=r.slice().sort((x,y)=>{for(const [c,d] of ks){const v=(x[c]>y[c]?1:x[c]<y[c]?-1:0)*(d==='desc'?-1:1);if(v)return v}return 0})}if(p.limit)r=r.slice(0,p.limit);return r.map(x=>pick(x,p.select))}
 if(m==='POST'){const rows=[].concat(clone(body)).map(x=>({id:'r'+(++uuid),status:'berjalan',jawaban:{},...x}));DB[t].push(...rows);return rows.map(x=>clone(x))}
 if(m==='PATCH'){const r=DB[t].filter(x=>p.f.every(f=>match(x,f)));r.forEach(x=>Object.assign(x,clone(body)));return r.map(x=>pick(x,p.select))}
 if(m==='DELETE'){DB[t]=DB[t].filter(x=>!p.f.every(f=>match(x,f)));return null}};
ctx.sbBatch_=l=>l.map(d=>ctx.sb_(d.method,d.path,d.body));
// data
DB.ujian.push({id:'U1',nama:'Try Out',jenjang:'MA',mapel:'Mat',sesi:null,token:'TOK1',durasi_menit:60,aktif:true,acak_soal:true,acak_opsi:true,tampil_kunci:false,catatan:null});
for(let i=1;i<=8;i++)DB.soal.push({id:'S'+i,ujian_id:'U1',urutan:i,tipe:i===7?'pgk':i===8?'isian':'pg',blok:[{tipe:'teks',isi:'Soal '+i}],opsi:i===8?[]:['A','B','C','D'].map(k=>({k,h:'opsi '+k})),kunci:i===7?['A','C']:i===8?['12,5']:['B'],bobot:1,created_at:'2026-01-0'+i});
DB.soal.push({id:'S9',ujian_id:'U1',urutan:9,tipe:'pg',blok:[{tipe:'teks',isi:'x'},{tipe:'gambar',isi:''}],opsi:[{k:'A',h:'a'},{k:'B',h:'b'}],kunci:['A'],bobot:1,created_at:'2026-01-09'});
const call=(f,...x)=>vm.runInContext(f+'.apply(null,'+JSON.stringify(x)+')',ctx);
const run=(code)=>vm.runInContext(code,ctx);
// 1 token salah
a.throws(()=>ctx.apiMulai('U1','salah',{nama:'Siti'}),/Token tidak cocok/);
a.throws(()=>ctx.apiMulai('U1','tok1',{nama:' '}),/Nama peserta wajib/);
// 2 mulai baru
const m1=ctx.apiMulai('U1','tok1',{nama:'Siti Aminah',nomor:'123',kelas:'9',sekolah:'MTs'});
a.strictEqual(m1.lanjut,false);a.strictEqual(m1.soal.length,8,'soal gambar kosong disembunyikan');
a(!JSON.stringify(m1).includes('kunci'),'tidak ada kunci di respons');a(!JSON.stringify(m1).includes('TOK1'));
a(m1.akhirMs-m1.serverNow<=60*60000&&m1.akhirMs-m1.serverNow>59*60000);
// 3 lanjut: sesi sama, urutan acak sama
ctx.apiSinkron(m1.sesiId,{S1:['B'],S2:[],S3:['A','X']});
const m2=ctx.apiMulai('U1','TOK1',{nama:'  siti aminah ',nomor:'123'});
a.strictEqual(m2.lanjut,true);a.strictEqual(m2.sesiId,m1.sesiId);
a.strictEqual(JSON.stringify(m2.soal),JSON.stringify(m1.soal),'acak konsisten saat dilanjutkan');
a.strictEqual(JSON.stringify(m2.jawaban),JSON.stringify({S1:['B'],S3:['A','X']}),'jawaban kosong dibuang');
const urutan=m1.soal.map(s=>s.id).join();a(urutan!=='S1,S2,S3,S4,S5,S6,S7,S8','soal teracak (kemungkinan sangat kecil sama)');
// 4 nomor beda = sesi baru
const m3=ctx.apiMulai('U1','tok1',{nama:'Siti Aminah',nomor:'999'});a.strictEqual(m3.lanjut,false);a.notStrictEqual(m3.sesiId,m1.sesiId);
// 5 selesai
const jw={};m1.soal.forEach(s=>{if(s.id==='S7')jw[s.id]=['C','A'];else if(s.id==='S8')jw[s.id]=['12.50'];else if(s.id==='S1')jw[s.id]=['B'];else if(s.id==='S2')jw[s.id]=['D'];});
const h=ctx.apiSelesai(m1.sesiId,jw);
a.strictEqual(h.total,8);a.strictEqual(h.benar+h.salah+h.kosong,8);a.strictEqual(h.benar,3);a.strictEqual(h.salah,1);a.strictEqual(h.kosong,4);
a.strictEqual(h.skor,37.5);a(h.rincian.every(r=>r.kunci===null),'kunci tersembunyi');a(h.durasi<=3600);
// 6 idempoten: jawaban kiriman kedua diabaikan
const h2=ctx.apiSelesai(m1.sesiId,{S1:['A'],S2:['B'],S3:['B'],S4:['B'],S5:['B'],S6:['B']});
a.strictEqual(JSON.stringify(h2),JSON.stringify(h),'idempoten');
// 7 sinkron ditolak setelah selesai
a.throws(()=>ctx.apiSinkron(m1.sesiId,{}),/sudah selesai/);
// 8 setelah selesai, mulai baru = sesi baru
a.strictEqual(ctx.apiMulai('U1','tok1',{nama:'Siti Aminah',nomor:'123'}).lanjut,false);
// 9 tampil_kunci
DB.ujian[0].tampil_kunci=true;const m4=ctx.apiMulai('U1','tok1',{nama:'Budi'});const h4=ctx.apiSelesai(m4.sesiId,{});
a.strictEqual(h4.benar,0);a.strictEqual(h4.kosong,8);a(h4.rincian.filter(r=>r.id!=='S8').every(r=>Array.isArray(r.kunci)));a.strictEqual(h4.rincian.find(r=>r.id==='S8').kunci,null,'kunci isian tidak dikirim');
// 10 sesi lewat waktu tidak dilanjutkan
const lama=ctx.apiMulai('U1','tok1',{nama:'Lama'});DB.sesi.find(s=>s.id===lama.sesiId).mulai_at=new Date(Date.now()-2*3600000).toISOString();
a.strictEqual(ctx.apiMulai('U1','tok1',{nama:'Lama'}).lanjut,false);
// 11 durasi dibatasi
const t=ctx.apiMulai('U1','tok1',{nama:'Telat'});DB.sesi.find(s=>s.id===t.sesiId).mulai_at=new Date(Date.now()-3*3600000).toISOString();
a.strictEqual(ctx.apiSelesai(t.sesiId,{}).durasi,3600);
// 12 beranda tanpa token
const b=ctx.apiBeranda();a(!JSON.stringify(b).includes('TOK1')&&!JSON.stringify(b).includes('token'));
// bersihJawaban_
a.strictEqual(JSON.stringify(ctx.bersihJawaban_({a:['x',' '],b:'str',c:[1,2]})),JSON.stringify({a:['x'],c:['1','2']}));

// admin hasil
ctx.CacheService.getScriptCache().put&&0;
const cache=vm.runInContext('CacheService.getScriptCache()',ctx);
a.throws(()=>ctx.adminHasil('T','U1'),/SESI_ADMIN/);
DB.sesi.length=0;
const mk=(id,nama,skor,benar,salah,durasi,st)=>DB.sesi.push({id,ujian_id:'U1',nama,nomor_peserta:null,kelas:null,sekolah:null,status:st||'selesai',skor,benar,salah,kosong:0,durasi_detik:durasi,selesai_at:'2026-01-01T00:00:00Z',jawaban:{x:['A']}});
mk('a','Ani',80,8,2,600);mk('b','Budi',80,8,2,500);mk('c','Cici',90,9,1,900);mk('d','Dedi',80,8,1,700);mk('e','Eka',50,5,5,100,'berjalan');mk('f','Fani',80,8,2,500);
vm.runInContext("CacheService.getScriptCache=function(){return {get:function(k){return k==='adm_T'?'1':null},put(){},remove(){}}}",ctx);
const hs=ctx.adminHasil('T','U1');
a.strictEqual(hs.map(x=>x.nama).join(),'Cici,Dedi,Budi,Fani,Ani','urut: nilai, benar, salah, waktu; tanpa sesi berjalan');
a(hs.every(x=>!('jawaban' in x)),'tanpa kolom jawaban');
ctx.adminSesiHapus('T','c');a.strictEqual(ctx.adminHasil('T','U1').length,4);

// ---- jadwal buka/tutup ----
DB.ujian[0].tampil_kunci=false;DB.ujian[0].acak_soal=false;
const jam=h=>new Date(Date.now()+h*3600000).toISOString();
const cacheBersih=()=>vm.runInContext("CacheService.getScriptCache=function(){return {get:function(k){return k==='adm_T'?'1':null},put(){},remove(){}}}",ctx);cacheBersih();
DB.ujian[0].buka_at=jam(2);
a.throws(()=>ctx.apiCekToken('U1','tok1'),/belum dibuka\. Dibuka pada \d+ \w+ \d{4}, \d\d\.\d\d WIB/);
a.throws(()=>ctx.apiMulai('U1','tok1',{nama:'X'}),/belum dibuka/);
a.strictEqual(ctx.apiBeranda().length,0,'belum dibuka tidak tampil di beranda');
DB.ujian[0].buka_at=jam(-2);DB.ujian[0].tutup_at=jam(2);
a.strictEqual(ctx.apiBeranda().length,1);a(!('buka_at' in ctx.apiBeranda()[0])&&!('tutup_at' in ctx.apiBeranda()[0]));
a(ctx.apiCekToken('U1','tok1').ujian.id==='U1');
const sdhMulai=ctx.apiMulai('U1','tok1',{nama:'Wati',nomor:'7'});
DB.ujian[0].tutup_at=jam(-1);
a.throws(()=>ctx.apiCekToken('U1','tok1'),/sudah ditutup pada/);
a.throws(()=>ctx.apiMulai('U1','tok1',{nama:'Baru'}),/sudah ditutup/);
a.strictEqual(ctx.apiMulai('U1','tok1',{nama:'Wati',nomor:'7'}).lanjut,true,'sesi berjalan boleh dilanjutkan setelah ditutup');
a.doesNotThrow(()=>ctx.apiSelesai(sdhMulai.sesiId,{}),'sesi berjalan boleh diselesaikan setelah ditutup');
a.strictEqual(ctx.apiBeranda().length,0,'ditutup tidak tampil');
DB.ujian[0].buka_at=null;DB.ujian[0].tutup_at=null;
// ---- duplikat ----
const n0=DB.ujian.length,s0=DB.soal.length;
const dup=ctx.adminUjianDuplikat('T','U1');
a.strictEqual(DB.ujian.length,n0+1);a.strictEqual(DB.soal.length,s0*2,'soal ikut disalin');
a.strictEqual(dup.aktif,false);a(dup.nama.endsWith(' (salinan)'));a.notStrictEqual(dup.token,'TOK1');a.strictEqual(dup.token.length,6);a(!dup.buka_at&&!dup.tutup_at);
const sal=DB.soal.filter(x=>x.ujian_id===dup.id);a.strictEqual(sal.length,s0);a.strictEqual(JSON.stringify(sal.map(x=>x.urutan)),JSON.stringify(DB.soal.filter(x=>x.ujian_id==='U1').map(x=>x.urutan)));
a(sal.every(x=>x.id!==undefined&&!DB.soal.some(o=>o!==x&&o.id===x.id)),'id soal unik');
a.throws(()=>ctx.adminUjianDuplikat('T','tidak-ada'),/tidak ditemukan/);
console.log('uji siswa lulus');
