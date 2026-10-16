const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const code=source.slice(source.indexOf('function encodeAssemblySelection('),source.indexOf('const node='));
const records=Array.from({length:36},(_,i)=>({row:184+i,key:'TG-'+(1000+i),link:'SB-'+String(179+i).padStart(6,'0'),rev:'r'.repeat(24),name:'Антон',product:'Стол',qty:1,order:'1675',status:'Ожидает приёмки',statusMismatch:false}));
const snapshot=(rows=records,token='b'.repeat(32))=>({week:'2026-10-12',assembly:rows.map(x=>({...x})),attendance:[],checks:[],bulkSelectionToken:token});
function setup(chosen=records){
 const elements=new Map(),sent=[],messages=[],confirmations=[];let reply=snapshot(),failure=null,resolveRead=null,reads=0;
 const el=id=>{if(!elements.has(id))elements.set(id,{textContent:'',disabled:false});return elements.get(id)};
 const c=vm.createContext({el,adminData:snapshot(chosen,'a'.repeat(32)),adminDataFresh:true,adminRequest:1,adminLoadedWeek:'2026-10-12',adminNormalizeWeek:()=>c.week,mutationPending:false,filterAssemblyRows:r=>r,queueFilters:()=>({}),renderAdmin(){},adminStatus:m=>messages.push(m),window:{confirm:m=>{confirmations.push(m);return true}},send:v=>sent.push(v),btoa,Uint8Array,Map,Set,String,Number,Error,week:'2026-10-12',adminRequestData:async w=>{assert.equal(w,'2026-10-12');reads++;if(failure)throw failure;if(resolveRead)return new Promise(resolve=>resolveRead(resolve));return reply}});
 vm.runInContext(code,c);el('admin-select-all').onclick();
 return {c,el,sent,messages,confirmations,click:()=>el('admin-bulk-accept').onclick(),reply:x=>reply=x,fail:e=>failure=e,defer:fn=>resolveRead=fn,reads:()=>reads};
}
const selected=payload=>{const bytes=Buffer.from(payload.selection,'base64url');return [...Array(2000).keys()].filter(i=>bytes[i>>3]&(1<<(i&7))).map(i=>i+6)};
(async()=>{
 let t=setup();await t.click();assert.equal(t.sent.length,1);assert.equal(t.reads(),1);assert.equal(t.sent[0].token,'b'.repeat(32),'Expired displayed token must never be sent');assert.equal(selected(t.sent[0]).length,36);assert.deepEqual(selected(t.sent[0]),records.map(x=>x.row));assert(t.confirmations[0].includes('36 заявок'));assert(Buffer.byteLength(JSON.stringify(t.sent[0]))<4096);
 // Do not silently add new rows found during refresh to an already-confirmed subset.
 t=setup(records.slice(0,20));await t.click();assert.equal(selected(t.sent[0]).length,20);
 // Fresh accepted rows are skipped; no replay can pay them again.
 t=setup();t.reply(snapshot(records.map((x,i)=>i<4?{...x,status:'Принято',rev:'x'.repeat(24)}:x)));await t.click();assert.equal(selected(t.sent[0]).length,32);assert(t.messages.some(x=>x.includes('пропущено: 4')));
 t=setup();t.reply(snapshot(records.map(x=>({...x,status:'Принято'}))));await t.click();assert.equal(t.sent.length,0);assert.match(t.messages.at(-1),/уже приняты/);
 // Same row reused for another ID or changed revision/status must fail before financial POST.
 for(const patch of [{key:'NEW-ID'},{link:'SB-999999'},{row:400},{rev:'x'.repeat(24)},{statusMismatch:true},{status:'Отклонено'}]){
  t=setup();const rows=snapshot().assembly;Object.assign(rows[0],patch);t.reply(snapshot(rows));await t.click();assert.equal(t.sent.length,0,JSON.stringify(patch));assert.match(t.messages.at(-1),/не отправлена/);
 }
 t=setup();t.reply(snapshot(records.slice(1)));await t.click();assert.equal(t.sent.length,0);
 t=setup();t.reply(snapshot([...records,records[0]]));await t.click();assert.equal(t.sent.length,0);assert.match(t.messages.at(-1),/Повтор ID/);
 t=setup();t.fail(Error('Сеть недоступна'));await t.click();assert.equal(t.sent.length,0);assert(t.el('admin-bulk-accept').disabled,'A failed read cannot authorize stale selection');
 t=setup();t.reply({...snapshot(),week:'2026-10-05'});await t.click();assert.equal(t.sent.length,0);
 t=setup();let release;t.defer(r=>release=r);const running=t.click();await Promise.resolve();await t.click();assert.equal(t.reads(),1,'Double click while refreshing cannot race');release(snapshot());await running;assert.equal(t.sent.length,1);
 t=setup();t.defer(r=>release=r);const changedWeek=t.click();await Promise.resolve();t.c.week='2026-10-05';t.c.adminRequest++;release(snapshot());await changedWeek;assert.equal(t.sent.length,0);assert.match(t.messages.at(-1),/неделя изменилась/);
 console.log('PASS bulk freshness: 36 exact IDs with new draft; all 2000 rows supported; no unseen additions; accepted skips; stale/deleted/reused/changed guard; bad/failed reads; double-click and week-change protection; no financial POST before fresh validation');
})().catch(e=>{console.error(e);process.exitCode=1});
