const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const code=source.slice(source.indexOf('function encodeAssemblySelection('),source.indexOf('const node='));
const elements=new Map(),sent=[];
const el=id=>{if(!elements.has(id))elements.set(id,{textContent:'',disabled:false});return elements.get(id)};
const items=Array.from({length:2000},(_,i)=>({row:i+6,key:'TG-'+i,link:'SB-'+String(i+1).padStart(6,'0'),rev:'r'.repeat(24),name:'Сборщик',product:'Стол',qty:1,order:'1675',status:'Ожидает приёмки'}));
let lastConfirm='';
const data={assembly:items,bulkSelectionToken:'a'.repeat(32)};
const c=vm.createContext({el,adminData:data,adminDataFresh:true,mutationPending:false,filterAssemblyRows:r=>r,queueFilters:()=>({}),renderAdmin(){},adminStatus(){},window:{confirm:text=>(lastConfirm=text,true)},send:v=>sent.push(v),btoa,Uint8Array,Map,Set,String,Number});
vm.runInContext(code,c);
el('admin-select-all').onclick();vm.runInContext('bulkSelectionStatus()',c);assert.equal(el('admin-bulk-count').textContent,'Выбрано: 2000');assert.equal(el('admin-bulk-accept').disabled,false);
el('admin-bulk-accept').onclick();const payload=sent.pop();assert.equal(payload.type,'adminAcceptSelection');assert(Buffer.byteLength(JSON.stringify(payload))<4096);assert.equal(payload.selection.length,334);assert.deepEqual([...Buffer.from(payload.selection,'base64url')],Array(250).fill(255));assert(lastConfirm.length<2400,'Confirmation must be usable on a phone');
const encode=vm.runInContext('encodeAssemblySelection',c);assert.throws(()=>encode([{row:6},{row:6}]),/Неверный/);assert.throws(()=>encode([{row:2006}]),/Неверный/);
el('admin-clear-selection').onclick();vm.runInContext('bulkSelectionStatus()',c);assert.equal(el('admin-bulk-count').textContent,'Выбрано: 0');
assert(!source.includes('selectedAssemblies.size>=8'));assert(!source.includes('chosen.length>8)return'));
// Older deployed servers remain compatible for small selections and cannot silently drop the rest.
data.bulkSelectionToken='';data.assembly=items.slice(0,1);el('admin-select-all').onclick();el('admin-bulk-accept').onclick();assert.equal(sent.pop().type,'adminAcceptAssembly');
const css=fs.readFileSync(__dirname+'/../appearance.css','utf8');assert.match(css,/#admin \.bonus-request\s*\{[^}]*background: var\(--surface-soft\)[^}]*color: var\(--ink\)/);assert(source.includes("'admin-card bonus-record'"));
console.log('PASS: selection of all 2000 available rows, payload under 4096 bytes, legacy compatibility, theme-aware bonus contrast');
