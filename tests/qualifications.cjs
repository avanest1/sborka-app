const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync(__dirname+'/../app.js','utf8');
const code=app.slice(app.indexOf('// Owner-only monthly assignments.'),app.indexOf('if(workerView)loadWorker();'));
const elements=new Map(),sent=[],staff=['Антон','Нарик','Леня','Фил','Кореш'];
function node(tag,text){return {tag,textContent:text,children:[],value:'',disabled:false,classList:{add(){},remove(){}},setAttribute(){},append(...n){this.children.push(...n)},replaceChildren(...n){this.children=n},focus(){}}}
const el=id=>{if(!elements.has(id))elements.set(id,node('div'));return elements.get(id)};
const levels=['I','II','III','IV','V'].map((level,i)=>({level,title:level,amount:[0,3000,5000,7000,10000][i],criteria:'Проверенные навыки'}));
const reply=month=>({supported:true,month,levels,entries:staff.map(name=>({name,level:'',amount:0,week:month+'-05',reason:'',rev:'r'.repeat(24),canEdit:true,problem:''}))});
let fail=false,old=false,defer=null,calls=0;
const context={adminView:true,today:'2026-11-13',staff,el,node,Intl,Date,Set,
 field(parent,label,type,value){const n=node(type,label);n.value=String(value);parent.append(n);return n},
 shortDate:s=>s,rubles:x=>x+' руб.',sendApproval:async data=>sent.push(data),approvalPending:null,mutationPending:false,qualificationDecisionStatus:null,
 hideInputKeyboard(){},approvalFeedback:m=>el('qualification-status').textContent=m,checkApproval(){},
 adminRequestData:async(_w,params)=>{calls++;assert.equal(params.view,'qualification');if(defer)return new Promise(r=>defer(r));if(fail)throw Error('Read failed');return old?{supported:false}:reply(params.month)}
};
const api=vm.runInNewContext(code+';({loadQualifications,get:()=>({qualificationData,qualificationFresh})})',context);
function form(i=0){return el('qualification-list').children[i].children.at(-1)}
(async()=>{
 el('qualification-month').value='2026-10';await api.loadQualifications();assert(api.get().qualificationFresh);
 const f=form(),select=f.children[0],save=f.children[3],confirm=f.children[5].children[1].children[0];
 assert.equal(select.value,'','No level may be assigned implicitly');save.onclick();assert.equal(sent.length,0);assert.match(el('qualification-status').textContent,/Выберите уровень/);
 select.value='III';save.onclick();assert.equal(sent.length,0,'Require explicit confirmation');await confirm.onclick();assert.equal(sent[0].type,'adminQualification');assert.equal(sent[0].month,'2026-10');assert.equal(sent[0].level,'III');assert.equal(sent[0].name,'Антон');assert(!Object.hasOwn(sent[0],'amount'),'Rates are chosen by server');
 context.mutationPending=true;select.value='V';save.onclick();await confirm.onclick();assert.equal(sent.length,1,'Pending receipt prevents another financial request');context.mutationPending=false;
 el('qualification-month').value='2026-11';await api.loadQualifications();assert.equal(form().children[0].value,'','Next month must not copy grade');await confirm.onclick();assert.equal(sent.length,1,'Detached October card cannot save after month changes');
 fail=true;await api.loadQualifications();assert(!api.get().qualificationFresh);assert(form().children[3].disabled);fail=false;
 old=true;await api.loadQualifications();assert(!api.get().qualificationFresh);assert.match(el('qualification-status').textContent,/tgInstallQualifications/);old=false;
 el('qualification-month').value='2026-09';await api.loadQualifications();assert.equal(el('qualification-list').children.length,0);assert(!api.get().qualificationFresh);
 let resolveOld;el('qualification-month').value='2026-10';defer=r=>resolveOld=r;const pending=api.loadQualifications();await Promise.resolve();defer=null;el('qualification-month').value='2026-11';await api.loadQualifications();resolveOld(reply('2026-10'));await pending;assert.equal(api.get().qualificationData.month,'2026-11');
 const before=calls;context.adminView=false;await api.loadQualifications();assert.equal(calls,before,'Employees cannot request this owner view');
 const cached=vm.runInNewContext(code+';({loadQualifications})',{...context,adminView:true,el:()=>null});await cached.loadQualifications();assert.equal(calls,before,'Older cached HTML must not crash or request a missing module');
 assert(app.includes("'adminAcceptSelection','adminQualification'].includes(saved.payload?.type)"),'Unconfirmed decision is restored after reopening');
 console.log('PASS qualification UI: owner only, manual grade, exact month, no carry, two-step confirmation, server rate, receipt lock, outdated backend, failed reads, stale month/card/reply');
})().catch(e=>{console.error(e);process.exitCode=1});
