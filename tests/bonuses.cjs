const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync(__dirname+'/../app.js','utf8');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
assert(app.includes("data.bonusDecisions===true)loadBonuses()"),'Old backend must not receive unsupported mutations');
assert(app.includes("if(payload.type==='adminBonusDecision'&&!bonusDataFresh)"));
assert(app.includes("'adminAccounting','adminBonusDecision'"),'Bonus decision must not require an employee selection');
assert(html.includes('Просьбы о надбавке · все недели'));
const code=app.slice(app.indexOf('let bonusData=null,'),app.indexOf('if(workerView)loadWorker();'));
const elements=new Map();
function node(tag,text){return {tag,textContent:text,children:[],value:'',disabled:false,append(...n){this.children.push(...n)},replaceChildren(...n){this.children=n},remove(){this.removed=true},focus(){},reportValidity(){return !!this.value}}}
const el=id=>{if(!elements.has(id))elements.set(id,node('div'));return elements.get(id)};
el('bonus-filter').value='pending';
let reply={supported:true,entries:[{key:'test',link:'SB-000001',rev:'revision',date:'2026-10-05',name:'Антон',product:'Стол',qty:1,order:'1675',request:'Монтаж 250р',decision:'На рассмотрении',canDecide:true,suggested:250,status:'Принято'}]},fail=false,resolveRequest;
const sent=[];
const api=vm.runInNewContext(code+';({loadBonuses,renderBonuses,editBonus,get:()=>({bonusData,bonusDataFresh})})',{
 adminView:true,el,node,field(parent,label,type,value){const n=node(type,label);n.value=value;parent.append(n);return n},
 shortDate:s=>s,rubles:x=>x+' руб.',window:{confirm:()=>true},send:data=>sent.push(data),
 adminRequestData:async(week,extra)=>{assert.equal(week,'','Queue must include every week');assert.equal(extra.view,'bonuses');if(resolveRequest)return new Promise(resolve=>resolveRequest(resolve));if(fail)throw Error('Read failed');return reply},
});
(async()=>{
 await api.loadBonuses();assert.equal(api.get().bonusDataFresh,true);
 const card=el('bonus-list').children[0];card.children.at(-1).onclick();const form=card.children.at(-1),actions=form.children.at(-1);
 actions.children[0].onclick();assert.equal(sent[0].type,'adminBonusDecision');assert.equal(sent[0].amount,250);assert.equal(sent[0].key,'test');assert.equal(sent[0].rev,'revision');
 actions.children[1].onclick();assert.equal(sent[1].decision,'Отклонено');assert.equal(sent[1].amount,0);
 fail=true;await api.loadBonuses();assert.equal(api.get().bonusDataFresh,false);assert.equal(el('bonus-list').children[0].children.at(-1).disabled,true);assert.match(el('bonus-status').textContent,/недоступны/);
 fail=false;reply={assembly:[]};await api.loadBonuses();assert.equal(api.get().bonusDataFresh,false,'Old backend must never authorize approvals');
 reply={supported:true,entries:[]};await api.loadBonuses();assert.equal(el('bonus-list').children[0].textContent,'Просьб на рассмотрении нет.');
 let first;resolveRequest=resolve=>{first=resolve};const older=api.loadBonuses();await Promise.resolve();resolveRequest=null;await api.loadBonuses();first({supported:true,entries:[{key:'stale',decision:'На рассмотрении'}]});await older;assert.equal(api.get().bonusData.entries.length,0,'Late response cannot restore stale requests');
 console.log('PASS bonuses: all weeks, exact approval amount, rejection, independent freshness, old backend compatibility, stale response handling');
})().catch(e=>{console.error(e);process.exitCode=1});
