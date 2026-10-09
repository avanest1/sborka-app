const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const moduleCode=source.slice(source.indexOf('// Decisions stay in the WebView.'),source.indexOf('if(workerView)loadWorker();'));
class Element{
 constructor(tag,text='',klass=''){this.tag=tag;this.textContent=text;this.className=klass;this.children=[];this.value='';this.disabled=false;this.attrs={};this.classes=new Set(klass.split(' '));this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),contains:c=>this.classes.has(c)}}
 append(...nodes){this.children.push(...nodes)} replaceChildren(...nodes){this.children=nodes} remove(){this.removed=true} focus(){this.focused=true} setAttribute(k,v){this.attrs[k]=v}
 reportValidity(){throw Error('No invisible browser validation allowed')}
}
const elements=new Map();const el=id=>{if(!elements.has(id))elements.set(id,new Element('div'));return elements.get(id)};
el('bonus-filter').value='pending';
const record={key:'TG-100000001',link:'SB-000001',rev:'aaaaaaaaaaaaaaaaaaaaaaaa',date:'2026-10-05',name:'Антон',product:'Шкафчик навесной',qty:1,order:'TEST-1',request:'Подсветка 250 рублей',suggested:250,decision:'На рассмотрении',canDecide:true,status:'Принято'};
let replies=[],posts=[],closed=0,reloads=0;
const context=vm.createContext({console,el,adminView:true,adminActionToken:'write-cap',adminEndpoint:'https://example.invalid/exec',mutationPending:false,TextEncoder,Uint8Array,
 window:{crypto:crypto.webcrypto,confirm(){throw Error('Suppressed WebView browser dialog')}},tg:{platform:'unknown',initData:'',sendData(){closed++;throw Error('Wrong closing transport')}},
 node:(...args)=>new Element(...args),field(parent,label,type,value){const input=new Element(type);input.value=String(value??'');parent.append(input);return input},shortDate:x=>x,rubles:x=>x+' ₽',hideInputKeyboard(){},bulkSelectionStatus(){},orderData:null,loadAdmin:async()=>{},loadOrder:async()=>{},loadGlobalSearch:async()=>{},
 localStorage:{getItem(){return null},setItem(){},removeItem(){}},setTimeout(fn,ms){if(ms)queueMicrotask(fn);return 0},
 fetch:async(url,options)=>{posts.push(JSON.parse(options.body));return {type:'opaque'}},
 adminRequestData:async(week,params)=>{if(params.view==='bonuses'){reloads++;return {supported:true,entries:[{...record}]}}const answer=replies.shift();if(answer instanceof Error)throw answer;return answer||{supported:true,state:'unknown'}},
});
vm.runInContext(moduleCode+';globalThis.api={loadBonuses,get:()=>({mutationPending,approvalPending}),checkApproval};',context);
function open(){const card=el('bonus-list').children[0];card.children.at(-1).onclick();const form=card.children.at(-1);return {form,amount:form.children[0],reason:form.children[1],actions:form.children[3].children,feedback:form.children[4],confirmation:form.children[5],confirm:form.children[5].children[1].children[0]}}
(async()=>{
 await context.api.loadBonuses();let ui=open();
 ui.amount.value='';ui.actions[0].onclick();assert.match(ui.feedback.textContent,/Укажите сумму/);assert.equal(posts.length,0);
 for(const invalid of ['0','-1','1000001','250.001','1e3']){ui.amount.value=invalid;ui.actions[0].onclick();assert.match(ui.feedback.textContent,/Укажите сумму/);assert.equal(posts.length,0)}
 ui.amount.value='250,50';ui.reason.value='';ui.actions[0].onclick();assert.match(ui.feedback.textContent,/основание/);
 ui.reason.value='Подсветка';ui.actions[0].onclick();assert(!ui.confirmation.classList.contains('hide'));assert.equal(posts.length,0,'First press only previews, cannot approve');
 replies=[{supported:true,state:'unknown'},{supported:true,state:'unknown'},{supported:true,state:'done',message:'Надбавка одобрена: 250,50 ₽.'}];
 const result=ui.confirm.onclick();const double=ui.confirm.onclick();await Promise.all([result,double]);
 assert.equal(posts.length,1);assert.equal(posts[0].payload.amount,250.5);assert.equal(posts[0].payload.key,record.key);assert.equal(posts[0].payload.rev,record.rev);assert.equal(posts[0].actionToken,'write-cap');assert.equal(closed,0);assert.match(el('bonus-status').textContent,/одобрена/);assert.equal(context.api.get().mutationPending,false);assert.equal(reloads,2);
 // Old owner button missing write capability: explicit error beside the button, no mutation.
 context.adminActionToken='';ui=open();ui.actions[0].onclick();await ui.confirm.onclick();assert.match(ui.feedback.textContent,/Решение не отправлено/);assert.equal(posts.length,1);context.adminActionToken='write-cap';
 // Reject does not depend on an approval amount, but does require a reason and explicit confirmation.
 ui.amount.value='';ui.reason.value='Оплата уже включена';ui.actions[1].onclick();assert.match(ui.confirmation.children[0].textContent,/Отклонить/);
 replies=[{supported:true,state:'unknown'},{supported:true,state:'unknown'},{supported:true,state:'failed',message:'Неделя закрыта'}];await ui.confirm.onclick();assert.equal(posts[1].payload.decision,'Отклонено');assert.equal(posts[1].payload.amount,0);assert.match(ui.feedback.textContent,/Неделя закрыта/);assert.equal(context.api.get().mutationPending,false);
 // A delivered request with lost confirmation keeps its ID and blocks new money changes visibly.
 ui=open();ui.actions[0].onclick();replies=[{supported:true,state:'unknown'},{supported:true,state:'unknown'},Error('Не удалось прочитать подтверждение')];await ui.confirm.onclick();assert.match(ui.feedback.textContent,/не подтверждено/);const id=context.api.get().approvalPending.id;const count=posts.length;
 ui.actions[0].onclick();assert.match(ui.feedback.textContent,/Предыдущее решение/);await ui.confirm.onclick();assert.equal(posts.length,count);
 replies=[{supported:true,state:'done',message:'Одобрено после проверки'}];await ui.form.children.at(-1).onclick();await new Promise(resolve=>setImmediate(resolve));assert.equal(context.api.get().approvalPending,null);assert.match(el('bonus-status').textContent,/после проверки/);assert.equal(closed,0);assert.equal(posts.at(-1).requestId,id);
 console.log('PASS full bonus button -> inline confirmation -> authenticated POST -> durable receipt: comma, invalid/empty amount, reason, double click, missing key, rejection, closed week, lost reply, same-ID recovery, no sendData/close');
})().catch(e=>{console.error(e);process.exitCode=1});
