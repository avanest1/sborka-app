const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/../app.js','utf8'),html=fs.readFileSync(__dirname+'/../index.html','utf8');
assert(html.includes('<option value="Премия">Премия</option>'));
const elements=new Map(),labels=new Map(),sent=[],messages=[];
function element(){return {value:'',disabled:false,required:false,textContent:'',classList:{toggle(){}},focus(){},reportValidity(){return true}}}
const el=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id)};
let supported=true,amountRequired=true,reads=0,release;
const context={el,document:{querySelector:q=>{if(!labels.has(q))labels.set(q,element());return labels.get(q)}},mutationPending:false,workerView:true,
 adminRequestData:async(_w,p,_retry,worker)=>{reads++;assert.equal(worker,true);assert.equal(p.view,'premiumStatus');if(release)return new Promise(r=>release(r));return {supported,amountRequired}},
 send:p=>sent.push(p),notice:m=>messages.push(m),parts:[],assemblyNote:()=>'',window:{confirm:()=>true},repeatSource:null,Date,JSON,Number};
const formCode=source.slice(source.indexOf('function loadingForm('),source.indexOf('function send(payload)'))+source.slice(source.indexOf('let premiumPreparing='),source.indexOf('// Read only, signed Telegram data.'));
vm.createContext(context);vm.runInContext(formCode,context);el('work-kind').value='Премия';el('product').value='Стол';el('date').value='2026-10-16';
const submit=()=>el('assembly-form').onsubmit({preventDefault(){},currentTarget:el('assembly-form')});
(async()=>{
 context.loadingForm();for(const id of ['product','qty','period'])assert(el(id).disabled);assert(!el('product').required);assert(!el('qty').required);assert(!el('order').required);assert(el('note').required);for(let i=0;i<7;i++)assert(el('part-'+i).disabled);
 assert.equal(labels.get('#assembly-form button[type="submit"]').textContent,'Отправить запрос премии');
 await submit();assert.equal(sent.length,0);assert.match(messages.at(-1),/Опишите/);
 el('note').value='Премия за помощь в отгрузке';
 for(const invalid of ['','0','-1','1e3','Infinity','1000001','1.001']){el('premium-amount').value=invalid;await submit();assert.equal(sent.length,0);assert.match(messages.at(-1),/Укажите сумму премии/)}
 assert(el('premium-amount').required);assert(!el('premium-amount').disabled);
 el('premium-amount').value='1500,50';await submit();assert.equal(sent.length,1);const p=sent[0];assert.equal(p.type,'premium');assert.equal(p.amount,1500.5);assert.equal(p.order,'');assert.equal(p.request,el('note').value);assert.equal(p.problem,'');assert.equal(p.responsible,'');assert(!Object.hasOwn(p,'product'));assert(!Object.hasOwn(p,'qty'));assert(!Object.hasOwn(p,'parts'));
 el('responsible').value='Мнение сотрудника';await submit();assert.equal(sent.at(-1).responsible,'Мнение сотрудника','Optional fields are independent');
 supported=false;await submit();assert.equal(sent.length,2);assert.match(messages.at(-1),/V32/);supported=true;
 amountRequired=false;await submit();assert.equal(sent.length,2);assert.match(messages.at(-1),/V33/);amountRequired=true;
 let resolve;release=r=>resolve=r;const waiting=submit();await Promise.resolve();await submit();resolve({supported:true,amountRequired:true});await waiting;assert.equal(sent.length,3,'No duplicate click during capability read');release=null;
 el('work-kind').value='Сборка';context.loadingForm();assert(!el('product').disabled);assert(el('order').required);assert(!el('note').required);assert(!el('part-0').disabled,'Table fields restored');assert(el('premium-amount').disabled);assert(!el('premium-amount').required);
 console.log('PASS premium form: no product/quantity/period, optional order/problems/responsible, mandatory request, clean separate payload, disabled hidden inputs, support check, double-click guard, assembly restored');
})().catch(e=>{console.error(e);process.exitCode=1});
