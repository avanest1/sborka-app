const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const moduleCode=source.slice(source.indexOf('// Decisions stay in the WebView.'),source.indexOf('// Owner-only monthly assignments.'));
class Element{
 constructor(tag,text='',klass=''){this.tag=tag;this.textContent=text;this.className=klass;this.children=[];this.value='';this.disabled=false;this.classes=new Set(klass.split(' '));this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x)}}
 append(...n){this.children.push(...n)}replaceChildren(...n){this.children=n}setAttribute(){}remove(){}focus(){}
}
const records=n=>Array.from({length:n},(_,i)=>({premium:true,key:'PR-TG-'+(700+i),link:'PR-'+String(i+1).padStart(6,'0'),rev:'r'.repeat(24),date:'2026-10-12',name:['Антон','Нарик','Леня','Фил','Кореш'][i%5],product:'Премия',qty:1,order:'',request:'Премия '+i,reasonDefault:'Премия '+i,requestedAmount:(i+1)*100+.5,amount:0,payBonus:0,decision:'На рассмотрении',canDecide:true}));
function setup(n=36){
 const elements=new Map(),rows=records(n),posts=[],receipts=new Map(),applied=new Map();let readFailure=false,lose=false;
 const el=id=>{if(!elements.has(id))elements.set(id,new Element('div'));return elements.get(id)};el('bonus-filter').value='pending';
 const c=vm.createContext({el,node:(...args)=>new Element(...args),field(){throw Error('Batch must not ask for manual fields')},shortDate:x=>x,rubles:x=>x+' ₽',adminView:true,adminActionToken:'owner-capability',adminEndpoint:'https://example.invalid/exec',mutationPending:false,TextEncoder,Uint8Array,Date,JSON,Map,Set,Number,Error,
  window:{crypto:crypto.webcrypto},tg:{platform:'ios',initData:'',sendData(){throw Error('Batch must not close the app')}},hideInputKeyboard(){},bulkSelectionStatus(){},orderData:null,loadAdmin:async()=>{},loadOrder:async()=>{},loadGlobalSearch:async()=>{},localStorage:{getItem(){return null},setItem(){},removeItem(){}},setTimeout(fn,ms){if(ms)queueMicrotask(fn);return 0},
  adminRequestData:async(_week,p)=>{
   if(p.view==='bonuses'){if(readFailure)throw Error('Не удалось обновить список');return {supported:true,entries:rows.map(r=>({...r}))}}
   assert.equal(p.view,'actionStatus');if(lose&&receipts.has(p.requestId))throw Error('Подтверждение потеряно');return receipts.get(p.requestId)||{supported:true,state:'unknown'};
  },
  fetch:async(_url,options)=>{
   const msg=JSON.parse(options.body);posts.push(msg);assert.equal(msg.actionToken,'owner-capability');assert(Buffer.byteLength(options.body)<4096);
   if(receipts.has(msg.requestId))return {type:'opaque'};
   const p=msg.payload,r=rows.find(r=>r.key===p.key);assert(r&&r.premium);
   if(r.rev!==p.rev){receipts.set(msg.requestId,{supported:true,state:'failed',message:'Запрос изменился'});return {type:'opaque'}}
   r.amount=p.decision==='Одобрено'?p.amount:0;r.payBonus=r.amount;r.decision=p.decision;r.rev='changed-'+r.key;applied.set(r.key,(applied.get(r.key)||0)+1);receipts.set(msg.requestId,{supported:true,state:'done',message:'Решение сохранено'});return {type:'opaque'};
  }
 });
 vm.runInContext(moduleCode+';globalThis.api={loadBonuses,decideSelectedPremiums,premiumBatchRecord,state:()=>({selected:[...selectedPremiums.keys()],running:premiumBulkRunning,pending:approvalPending,mutationPending})};',c);
 return {c,el,rows,posts,applied,receipts,failRead:()=>readFailure=true,lose:()=>lose=true,recover:()=>lose=false};
}
(async()=>{
 let t=setup();await t.c.api.loadBonuses();t.el('premium-select-all').onclick();assert.equal(t.c.api.state().selected.length,36);assert.match(t.el('premium-bulk-count').textContent,/36/);
 const running=t.el('premium-bulk-approve').onclick();await t.el('premium-bulk-approve').onclick();await running;
 assert.equal(t.posts.length,36);assert(t.rows.every(r=>r.decision==='Одобрено'&&r.amount===r.requestedAmount));assert([...t.applied.values()].every(n=>n===1));assert.equal(t.c.api.state().selected.length,0);assert.match(t.el('premium-bulk-status').textContent,/Одобрено: 36/);
 assert.equal(t.posts.reduce((s,p)=>s+Math.round(p.payload.amount*100),0),t.rows.reduce((s,r)=>s+Math.round(r.requestedAmount*100),0));
 // Rejection does not require typing a reason or amount for each selected employee.
 t=setup(12);await t.c.api.loadBonuses();t.el('premium-select-all').onclick();await t.el('premium-bulk-decline').onclick();assert.equal(t.posts.length,12);assert(t.rows.every(r=>r.decision==='Отклонено'&&r.payBonus===0));assert(t.posts.every(p=>p.payload.reason==='Отклонено руководителем'));
 // A selection is the exact set checked by the owner, including manual partial selection.
 t=setup(5);await t.c.api.loadBonuses();const card=t.el('bonus-list').children[2],box=card.children[0].children[0];box.checked=true;box.onchange();await t.el('premium-bulk-approve').onclick();assert.equal(t.posts.length,1);assert.equal(t.posts[0].payload.key,t.rows[2].key);
 // One changed or removed request is skipped; no newly fetched request joins the confirmed selection.
 t=setup(5);await t.c.api.loadBonuses();t.el('premium-select-all').onclick();t.rows[0].requestedAmount=999;t.rows.splice(1,1);t.rows.push({...records(1)[0],key:'PR-TG-9999',link:'PR-999999'});await t.el('premium-bulk-approve').onclick();assert.equal(t.posts.length,3);assert(!t.applied.has('PR-TG-9999'));assert.match(t.el('premium-bulk-status').textContent,/Требует проверки: 2/);
 t=setup(3);await t.c.api.loadBonuses();t.el('premium-select-all').onclick();Object.assign(t.rows[0],{decision:'Одобрено',amount:t.rows[0].requestedAmount,payBonus:t.rows[0].requestedAmount,rev:'new'});await t.el('premium-bulk-approve').onclick();assert.equal(t.posts.length,2);assert.match(t.el('premium-bulk-status').textContent,/Уже выполнено: 1/);
 // Unknown/failed reads cannot authorize even the first financial POST.
 t=setup(2);await t.c.api.loadBonuses();t.el('premium-select-all').onclick();t.failRead();await t.el('premium-bulk-approve').onclick();assert.equal(t.posts.length,0);assert.equal(t.c.api.state().selected.length,2);
 // A committed decision with a lost receipt stops the rest; recovery uses the same request ID.
 t=setup(3);await t.c.api.loadBonuses();t.el('premium-select-all').onclick();t.lose();await t.el('premium-bulk-approve').onclick();assert.equal(t.posts.length,1);assert.equal(t.c.api.state().mutationPending,true);assert.equal(t.c.api.state().selected.length,3);assert.match(t.el('premium-bulk-status').textContent,/приостановлена/);
 t.recover();await t.el('admin-action-check').onclick();await new Promise(r=>setImmediate(r));await t.el('premium-bulk-approve').onclick();assert.equal(t.posts.length,3);assert(t.rows.every(r=>r.decision==='Одобрено'));assert([...t.applied.values()].every(n=>n===1));
 // Nonpremium requests and legacy requests without a numeric amount are never selected.
 t=setup(5);t.rows[0].premium=false;t.rows[1].requestedAmount=null;t.rows[2].canDecide=false;await t.c.api.loadBonuses();t.el('premium-select-all').onclick();assert.equal(t.c.api.state().selected.length,2);t.el('premium-clear-selection').onclick();assert.equal(t.c.api.state().selected.length,0);
 console.log('PASS premium batch: 36 individual amounts, no 8-item limit, exact subset, approve/reject, repeat-click guard, changed/deleted/skipped/new guards, failed reads, lost-receipt stop/recovery, original auth/idempotence, no sendData/close');
})().catch(e=>{console.error(e);process.exitCode=1});
